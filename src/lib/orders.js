// Sipariş yaşam döngüsü: stok rezervasyonu, ödeme, iptal, kargo, iade.
// Durum geçişleri "koşullu update" (updateMany + where status) ile yapılır;
// böylece webhook iki kez gelse ya da kullanıcı iki kez tıklasa bile
// stok iki kez düşmez / iki kez iade edilmez.
import { prisma } from "@/lib/db";
import { refundPayment, expireCheckoutSession, getCheckoutSessionState } from "@/lib/payments";
import { createInvoiceForOrder, issueWithProvider } from "@/lib/invoice";
import { refundForUnits } from "@/lib/campaign";
import {
  USER_CANCELLABLE,
  ADMIN_CANCELLABLE,
  ACTIVE_RETURN_STATUSES,
  RETURN_REASONS,
  canRequestReturn,
} from "@/lib/orderStatus";

export class OrderError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const PENDING_TTL_MIN = 35; // Stripe oturumu 30 dk; biraz pay bırakıldı

function addEvent(tx, orderId, type, message) {
  return tx.orderEvent.create({ data: { orderId, type, message } });
}

// Aynı ürün+renk+beden birden çok satırda gelirse tek satırda topla
function groupLines(lines) {
  const map = new Map();
  for (const l of lines) {
    const key = `${l.productId}-${l.colorId ?? "x"}-${l.size}`;
    const prev = map.get(key);
    map.set(key, prev ? { ...prev, qty: prev.qty + l.qty } : { ...l });
  }
  return [...map.values()];
}

// Renk bilgisi olmayan (renkler eklenmeden önceki) sipariş kalemleri,
// ürünün ilk rengine (migration'daki "Standart" renk) geri stoklanır.
async function resolveColorId(tx, item) {
  if (item.colorId) return item.colorId;
  const c = await tx.productColor.findFirst({
    where: { productId: item.productId },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  return c?.id ?? null;
}

async function restock(tx, items) {
  for (const it of groupLines(items)) {
    const colorId = await resolveColorId(tx, it);
    if (!colorId) continue; // ürün tamamen silinmiş
    await tx.productVariant.updateMany({
      where: { colorId, size: it.size },
      data: { stock: { increment: it.qty } },
    });
  }
}

// =========================
// OLUŞTURMA + STOK REZERVASYONU
// =========================

export async function createPendingOrder({ userId, customer, billing, total, discount = 0, campaign = null, lines }) {
  return prisma.$transaction(async (tx) => {
    for (const l of groupLines(lines)) {
      // "stock >= qty" koşulu sayesinde iki kişi son ürünü aynı anda alamaz.
      const r = await tx.productVariant.updateMany({
        where: { colorId: l.colorId, size: l.size, stock: { gte: l.qty } },
        data: { stock: { decrement: l.qty } },
      });
      if (r.count === 0) {
        const v = await tx.productVariant.findUnique({
          where: { colorId_size: { colorId: l.colorId, size: l.size } },
        });
        const left = v?.stock ?? 0;
        const label = `${l.name} (${l.colorName}, ${l.size})`;
        throw new OrderError(
          left > 0
            ? `${label} için stokta yalnızca ${left} adet kaldı. Sepetini güncelleyip tekrar dene.`
            : `${label} az önce tükendi. Sepetinden çıkarıp tekrar dene.`,
          409
        );
      }
    }

    const order = await tx.order.create({
      data: {
        userId,
        customerName: customer.name,
        address: customer.address,
        total,
        discountTotal: discount,
        campaign,
        status: "pending",
        stockReserved: true,
        billingType: billing.type,
        billingName: billing.name,
        billingAddress: billing.address,
        taxId: billing.taxId,
        taxOffice: billing.taxOffice,
        items: { create: lines },
      },
    });
    await addEvent(tx, order.id, "created", "Sipariş oluşturuldu, ödeme bekleniyor.");
    return order;
  });
}

export async function attachStripeSession(orderId, stripeSessionId) {
  return prisma.order.update({ where: { id: orderId }, data: { stripeSessionId } });
}

// Ödenmemiş siparişin rezervini bırakır (idempotent).
export async function expireOrder(orderId, message = "Ödeme tamamlanmadı, sipariş kapatıldı.") {
  return prisma.$transaction(async (tx) => {
    // Önce stok düşülmüş (rezerve edilmiş) haliyle kapatmayı dene → stoğu geri ekle.
    const reserved = await tx.order.updateMany({
      where: { id: orderId, status: "pending", stockReserved: true },
      data: { status: "expired", stockReserved: false },
    });
    if (reserved.count === 1) {
      const items = await tx.orderItem.findMany({ where: { orderId } });
      await restock(tx, items);
    } else {
      // Eski (rezervasyon öncesi) sipariş: stok hiç düşülmemişti, sadece kapat.
      const plain = await tx.order.updateMany({
        where: { id: orderId, status: "pending" },
        data: { status: "expired" },
      });
      if (plain.count === 0) return false;
    }
    await addEvent(tx, orderId, "expired", message);
    return true;
  });
}

// Kullanıcının ödemeyi yarıda bıraktığı sipariş için ayrılan stoğu bırakır.
// Önce Stripe'a sorar: ödeme aslında tamamlanmışsa (webhook gecikmiş olabilir)
// siparişi kapatmak yerine ödendi olarak işaretler. Stripe'a ulaşılamazsa hiçbir
// şey yapmaz; bir sonraki temizlikte tekrar denenir.
// Dönüş: "paid" | "expired" | "noop" | "unknown"
export async function abandonCheckout(order, message = "Ödeme tamamlanmadı, sipariş kapatıldı.") {
  if (!order || order.status !== "pending") return "noop";

  const settleIfPaid = async () => {
    const st = await getCheckoutSessionState(order.stripeSessionId);
    if (st?.status === "complete" && st.paymentStatus === "paid") {
      await markOrderPaid({ stripeSessionId: order.stripeSessionId, paymentIntentId: st.paymentIntentId });
      return true;
    }
    return false;
  };

  try {
    if (await settleIfPaid()) return "paid";
    const closed = await expireCheckoutSession(order.stripeSessionId);
    // Kapatılamadıysa o anda ödeme tamamlanmış olabilir: tekrar kontrol et
    if (!closed && (await settleIfPaid())) return "paid";
  } catch (e) {
    console.error("Ödeme oturumu kontrol edilemedi:", e.message);
    return "unknown";
  }

  await expireOrder(order.id, message);
  return "expired";
}

export async function expireOrderBySession(stripeSessionId) {
  const order = await prisma.order.findUnique({ where: { stripeSessionId } });
  if (order) await expireOrder(order.id);
}

// Webhook gelmediği durumlar için (örn. yerelde `stripe listen` kapalı):
// süresi geçmiş bekleyen siparişlerin stoğunu geri bırakır.
export async function releaseStalePendingOrders() {
  const cutoff = new Date(Date.now() - PENDING_TTL_MIN * 60 * 1000);
  const stale = await prisma.order.findMany({
    where: { status: "pending", createdAt: { lt: cutoff } },
    select: { id: true, status: true, stripeSessionId: true },
    take: 50,
  });
  for (const o of stale) await abandonCheckout(o);
}

// Aynı kullanıcı yeni bir ödeme başlatırsa, yarım kalmış önceki ödemelerinin
// ayırdığı stok hemen serbest bırakılır.
export async function releaseUserPendingOrders(userId) {
  const pending = await prisma.order.findMany({
    where: { userId, status: "pending" },
    select: { id: true, status: true, stripeSessionId: true },
  });
  for (const o of pending) await abandonCheckout(o, "Yeni bir ödeme başlatıldığı için önceki ödeme kapatıldı.");
}

// =========================
// ÖDEME
// =========================

export async function markOrderPaid({ stripeSessionId, paymentIntentId }) {
  const result = await prisma.$transaction(async (tx) => {
    const r = await tx.order.updateMany({
      where: { stripeSessionId, status: "pending" },
      data: { status: "paid", paidAt: new Date(), paymentIntentId },
    });
    const order = await tx.order.findUnique({ where: { stripeSessionId } });
    if (!order || r.count === 0) return { order, invoice: null };

    await addEvent(tx, order.id, "paid", "Ödemen alındı. Siparişin hazırlanmak üzere sıraya girdi.");
    const invoice = await createInvoiceForOrder(tx, order);
    await addEvent(tx, order.id, "invoice", `Faturan oluşturuldu (${invoice.number}).`);
    return { order, invoice };
  });

  if (result.invoice) {
    // Resmi e-Arşiv gönderimi transaction dışında; başarısız olsa bile ödeme kaydı etkilenmez.
    try {
      await issueWithProvider(result.invoice, result.order);
    } catch (e) {
      console.error("Fatura entegratöre gönderilemedi:", e.message);
    }
  }
  return result.order;
}

// =========================
// İPTAL
// =========================

async function refundOrderRemainder(order, keySuffix) {
  const remaining = order.total - order.refundedAmount;
  if (remaining <= 0) return { ok: true, amount: 0 };

  try {
    // Eski siparişlerde ödeme kimliği yoksa refundPayment hata fırlatır → manuel iade kaydı düşülür.
    await refundPayment({
      paymentIntentId: order.paymentIntentId,
      amountTL: remaining,
      idempotencyKey: `order-${order.id}-${keySuffix}`,
    });
    await prisma.$transaction([
      prisma.order.update({ where: { id: order.id }, data: { refundedAmount: order.total } }),
      prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: "refund",
          message: `${remaining.toLocaleString("tr-TR")} ₺ kartına iade edildi. Bankana bağlı olarak 3–10 iş günü içinde hesabına yansır.`,
        },
      }),
    ]);
    return { ok: true, amount: remaining };
  } catch (e) {
    console.error("İade başarısız:", e.message);
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: "refund_failed",
        message: "Para iaden otomatik başlatılamadı; ekibimiz manuel olarak iade edecek.",
      },
    });
    return { ok: false, amount: 0 };
  }
}

export async function cancelOrder({ orderId, userId = null, byAdmin = false, reason = "" }) {
  const allowed = byAdmin ? ADMIN_CANCELLABLE : USER_CANCELLABLE;
  const where = { id: orderId, ...(userId ? { userId } : {}) };

  const order = await prisma.order.findFirst({ where, include: { items: true } });
  if (!order) throw new OrderError("Sipariş bulunamadı.", 404);

  if (!allowed.includes(order.status)) {
    throw new OrderError(
      order.status === "shipped" || order.status === "delivered"
        ? "Siparişin kargoya verildiği için artık iptal edilemiyor. Teslim aldıktan sonra iade talebi oluşturabilirsin."
        : "Bu sipariş iptal edilemez.",
      409
    );
  }

  // Ödenmemiş sipariş: ödeme oturumunu kapat, rezervi bırak.
  if (order.status === "pending") {
    const result = await abandonCheckout(order, "Sipariş iptal edildi (ödeme yapılmamıştı).");
    if (result === "paid") {
      throw new OrderError("Bu siparişin ödemesi az önce tamamlandı. Sayfayı yenileyip tekrar dene.", 409);
    }
    if (result === "unknown") throw new OrderError("Ödeme durumu kontrol edilemedi, biraz sonra tekrar dene.", 503);
    return { refunded: 0, refundOk: true };
  }

  const claimed = await prisma.$transaction(async (tx) => {
    const r = await tx.order.updateMany({
      where: { id: order.id, status: { in: allowed } },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: reason?.slice(0, 500) || null,
        stockReserved: false,
      },
    });
    if (r.count === 0) return false; // bu arada durum değişti

    // Kargodaki sipariş iptal edilirse ürün henüz depoya dönmedi; stok iade teslim alınınca eklenir.
    if (order.stockReserved && order.status !== "shipped") await restock(tx, order.items);
    await tx.invoice.updateMany({ where: { orderId: order.id }, data: { status: "cancelled" } });
    await addEvent(
      tx,
      order.id,
      "cancelled",
      byAdmin ? `Sipariş mağaza tarafından iptal edildi.${reason ? ` Not: ${reason}` : ""}` : "Siparişini iptal ettin."
    );
    return true;
  });

  if (!claimed) throw new OrderError("Sipariş durumu değişti, sayfayı yenileyip tekrar dene.", 409);

  const refund = await refundOrderRemainder(order, "cancel");
  return { refunded: refund.amount, refundOk: refund.ok };
}

// Admin: iptal sonrası başarısız olan para iadesini yeniden dener
export async function retryCancelRefund(orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "cancelled") throw new OrderError("Sipariş iptal durumunda değil.");
  return refundOrderRemainder(order, "cancel");
}

// =========================
// KARGO AKIŞI (admin)
// =========================

export async function advanceOrder({ orderId, action, carrier, trackingNumber }) {
  const transitions = {
    prepare: { from: ["paid"], to: "preparing", msg: () => "Siparişin hazırlanıyor." },
    ship: {
      from: ["paid", "preparing"],
      to: "shipped",
      msg: () => `Siparişin kargoya verildi: ${carrier} · Takip no ${trackingNumber}`,
    },
    deliver: { from: ["shipped"], to: "delivered", msg: () => "Siparişin teslim edildi. İyi günlerde giy!" },
  };
  const t = transitions[action];
  if (!t) throw new OrderError("Geçersiz işlem.");
  if (action === "ship" && (!carrier || !trackingNumber?.trim())) {
    throw new OrderError("Kargo firması ve takip numarası zorunlu.");
  }

  const now = new Date();
  const data = { status: t.to };
  if (action === "ship") Object.assign(data, { carrier, trackingNumber: trackingNumber.trim(), shippedAt: now });
  if (action === "deliver") data.deliveredAt = now;

  return prisma.$transaction(async (tx) => {
    const r = await tx.order.updateMany({ where: { id: orderId, status: { in: t.from } }, data });
    if (r.count === 0) throw new OrderError("Sipariş bu işlem için uygun durumda değil.", 409);
    await addEvent(tx, orderId, t.to, t.msg());
    return true;
  });
}

// =========================
// İADE
// =========================

// Her sipariş kalemi için hâlâ iade edilebilecek adedi hesaplar
export async function getReturnableQuantities(orderId) {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    include: { returnItems: { include: { returnRequest: { select: { status: true } } } } },
  });
  return items.map((it) => {
    const used = it.returnItems
      .filter((ri) => ACTIVE_RETURN_STATUSES.includes(ri.returnRequest.status))
      .reduce((s, ri) => s + ri.qty, 0);
    return {
      orderItemId: it.id,
      name: it.name,
      colorName: it.colorName,
      size: it.size,
      price: it.price,
      qty: it.qty,
      lineTotal: it.lineTotal,
      used,
      returnable: it.qty - used,
    };
  });
}

export async function createReturnRequest({ userId, orderId, items, reason, note }) {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
  if (!order) throw new OrderError("Sipariş bulunamadı.", 404);
  if (!canRequestReturn(order)) {
    throw new OrderError(
      order.status === "delivered"
        ? "14 günlük iade süresi dolmuş. Yardım için bizimle iletişime geç."
        : "İade talebi yalnızca teslim edilmiş siparişler için oluşturulabilir."
    );
  }
  if (!RETURN_REASONS.includes(reason)) throw new OrderError("Lütfen bir iade nedeni seç.");
  if (!Array.isArray(items) || items.length === 0) throw new OrderError("İade edilecek en az bir ürün seç.");

  const returnable = new Map((await getReturnableQuantities(orderId)).map((r) => [r.orderItemId, r]));
  let refundAmount = 0;
  const clean = [];
  for (const it of items) {
    const r = returnable.get(Number(it.orderItemId));
    const qty = Number(it.qty);
    if (!r || !Number.isInteger(qty) || qty < 1) continue;
    if (qty > r.returnable) throw new OrderError(`${r.name} (${r.size}) için en fazla ${r.returnable} adet iade edebilirsin.`);
    // Kampanya indirimi varsa müşteri ödediği tutarı geri alır (satıra orantılı)
    const amount = refundForUnits(r, r.used, qty);
    clean.push({ orderItemId: r.orderItemId, qty, amount });
    refundAmount += amount;
    r.used += qty; // aynı kalem istekte iki kez geldiyse fazla iade edilmesin
    r.returnable -= qty;
  }
  if (clean.length === 0) throw new OrderError("İade edilecek en az bir ürün seç.");

  return prisma.$transaction(async (tx) => {
    const ret = await tx.returnRequest.create({
      data: {
        orderId,
        userId,
        reason,
        note: note?.slice(0, 1000) || null,
        refundAmount,
        items: { create: clean },
      },
    });
    await addEvent(tx, orderId, "return_requested", `İade talebin (#${ret.id}) alındı. En geç 2 iş günü içinde inceleyeceğiz.`);
    return ret;
  });
}

export async function updateReturn({ returnId, action, adminNote, restockItems = true }) {
  const ret = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: { items: { include: { orderItem: true } }, order: true },
  });
  if (!ret) throw new OrderError("İade talebi bulunamadı.", 404);

  const note = adminNote?.trim()?.slice(0, 1000) || null;

  if (action === "approve" || action === "reject") {
    const to = action === "approve" ? "approved" : "rejected";
    if (action === "reject" && !note) throw new OrderError("Reddetme nedeni yaz; müşteri bunu görecek.");
    const r = await prisma.returnRequest.updateMany({
      where: { id: returnId, status: "requested" },
      data: { status: to, adminNote: note },
    });
    if (r.count === 0) throw new OrderError("Talep bu işlem için uygun durumda değil.", 409);
    await prisma.orderEvent.create({
      data: {
        orderId: ret.orderId,
        type: `return_${to}`,
        message:
          to === "approved"
            ? `İade talebin (#${ret.id}) onaylandı. Ürünleri etiketleri üzerinde, orijinal ambalajıyla kargoya verebilirsin.${note ? ` Not: ${note}` : ""}`
            : `İade talebin (#${ret.id}) reddedildi. Neden: ${note}`,
      },
    });
    return { ok: true };
  }

  if (action === "refund") {
    // Önce talebi "sahiplen" (çift iadeyi önler), sonra parayı iade et.
    const claimed = await prisma.returnRequest.updateMany({
      where: { id: returnId, status: "approved" },
      data: { status: "refunded", refundedAt: new Date(), adminNote: note ?? ret.adminNote },
    });
    if (claimed.count === 0) throw new OrderError("Önce talebi onaylamalısın.", 409);

    try {
      await refundPayment({
        paymentIntentId: ret.order.paymentIntentId,
        amountTL: ret.refundAmount,
        idempotencyKey: `return-${ret.id}`,
      });
    } catch (e) {
      // Para gitmediyse durumu geri al; admin tekrar deneyebilsin.
      await prisma.returnRequest.update({ where: { id: returnId }, data: { status: "approved", refundedAt: null } });
      throw new OrderError(`Para iadesi yapılamadı: ${e.message}`, 502);
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: ret.orderId },
        data: { refundedAmount: { increment: ret.refundAmount } },
      });
      if (restockItems) {
        await restock(
          tx,
          ret.items.map((ri) => ({
            productId: ri.orderItem.productId,
            colorId: ri.orderItem.colorId,
            size: ri.orderItem.size,
            qty: ri.qty,
          }))
        );
      }
      await addEvent(
        tx,
        ret.orderId,
        "return_refunded",
        `İade ettiğin ürünler bize ulaştı. ${ret.refundAmount.toLocaleString("tr-TR")} ₺ kartına iade edildi; bankana bağlı olarak 3–10 iş günü içinde yansır.`
      );
    });
    return { ok: true };
  }

  throw new OrderError("Geçersiz işlem.");
}

// =========================
// OKUMA
// =========================

export async function getOrdersForUser(userId) {
  return prisma.order.findMany({
    where: { userId, status: { not: "expired" } },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      events: { orderBy: { createdAt: "asc" } },
      returns: { include: { items: true }, orderBy: { createdAt: "desc" } },
      invoice: { select: { number: true, status: true } },
    },
  });
}

export async function getOrderWithItems(orderId, userId) {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId }, include: { items: true } });
  if (!order) return null;
  return {
    id: order.id,
    total: order.total,
    discountTotal: order.discountTotal,
    paymentStatus: order.status === "pending" ? "pending" : "paid",
    items: order.items.map((it) => ({ name: it.name, colorName: it.colorName, size: it.size, qty: it.qty, lineTotal: it.lineTotal })),
  };
}

export async function getOrderByStripeSession(stripeSessionId, userId) {
  return prisma.order.findFirst({ where: { stripeSessionId, userId } });
}
