import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { validateCart } from "@/lib/cart";
import { getStripe } from "@/lib/payments";
import {
  createPendingOrder,
  attachStripeSession,
  expireOrder,
  releaseStalePendingOrders,
  OrderError,
} from "@/lib/orders";

const bad = (msg, status = 400) => NextResponse.json({ error: msg }, { status });
const str = (v, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Fatura bilgisini doğrular. Bireyselde TCKN isteğe bağlıdır.
function parseBilling(body, customer) {
  const b = body.billing || {};
  const type = b.type === "corporate" ? "corporate" : "individual";
  const sameAddress = b.sameAddress !== false;

  const billing = {
    type,
    name: type === "corporate" ? str(b.companyName, 200) : customer.name,
    address: sameAddress ? customer.address : str(b.address, 500),
    taxId: str(b.taxId, 11) || null,
    taxOffice: type === "corporate" ? str(b.taxOffice, 100) : null,
  };

  if (!billing.address) return { error: "Fatura adresi zorunlu." };
  if (type === "corporate") {
    if (!billing.name) return { error: "Firma unvanı zorunlu." };
    if (!/^\d{10}$/.test(billing.taxId || "")) return { error: "Vergi numarası 10 haneli olmalı." };
    if (!billing.taxOffice) return { error: "Vergi dairesi zorunlu." };
  } else if (billing.taxId && !/^\d{11}$/.test(billing.taxId)) {
    return { error: "T.C. kimlik numarası 11 haneli olmalı (ya da boş bırak)." };
  }
  return { billing };
}

// POST /api/checkout  (oturum gerekli)
// Body: { items: [{ id, size, qty }], customer: { name, address }, billing: {...} }
// Akış:
//   1) Sepet sunucuda yeniden doğrulanır/fiyatlandırılır (istemciye güvenilmez).
//   2) Stok atomik olarak rezerve edilir ve sipariş 'pending' yazılır.
//   3) Stripe Checkout Session açılır (30 dk geçerli). Süre dolarsa ya da
//      kullanıcı vazgeçerse rezerv geri bırakılır.
export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return bad("Ödeme yapmak için giriş yapmalısın.", 401);

  let body;
  try { body = await req.json(); } catch { return bad("Geçersiz istek gövdesi (JSON bekleniyor)."); }

  const customer = { name: str(body.customer?.name, 120), address: str(body.customer?.address, 500) };
  if (!customer.name) return bad("Ad Soyad zorunlu.");
  if (!customer.address) return bad("Teslimat adresi zorunlu.");

  const { billing, error: billingError } = parseBilling(body, customer);
  if (billingError) return bad(billingError);

  // Webhook'u kaçırmış eski bekleyen siparişlerin stoğunu serbest bırak
  await releaseStalePendingOrders().catch(() => {});

  const { error, status, lines, total } = await validateCart(body.items);
  if (error) return bad(error, status);
  if (total <= 0) return bad("Sepet tutarı geçersiz.");

  let order;
  try {
    order = await createPendingOrder({ userId: user.id, customer, billing, total, lines });
  } catch (e) {
    if (e instanceof OrderError) return bad(e.message, e.status);
    throw e;
  }

  let session;
  try {
    const origin = new URL(req.url).origin;
    session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: user.email,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // Stripe'ın izin verdiği en kısa süre
      line_items: lines.map((l) => ({
        price_data: {
          currency: "try",
          product_data: { name: `${l.name} (${l.size})` },
          unit_amount: Math.round(l.price * 100), // Stripe tutarları kuruş (en küçük birim) bekler
        },
        quantity: l.qty,
      })),
      success_url: `${origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/order/cancel?order_id=${order.id}`,
      metadata: { orderId: String(order.id), userId: String(user.id) },
    });
  } catch (e) {
    await expireOrder(order.id, "Ödeme sayfası açılamadı, sipariş kapatıldı.");
    return bad(e.message || "Stripe oturumu oluşturulamadı.", 502);
  }

  await attachStripeSession(order.id, session.id);
  return NextResponse.json({ ok: true, url: session.url });
}
