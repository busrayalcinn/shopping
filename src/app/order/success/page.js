import Link from "next/link";
import ClearCart from "@/components/ClearCart";
import { getSessionUser } from "@/lib/auth";
import { getStripe } from "@/lib/payments";
import { markOrderPaid, getOrderWithItems, getOrderByStripeSession } from "@/lib/orders";

const fmt = (n) => `${n.toLocaleString("tr-TR")} ₺`;

// Bu sayfa, Stripe'ın barındırdığı ödeme sayfasından success_url'e dönünce açılır.
// Asıl "ödeme onaylandı" kaydı /api/webhook üzerinden gelir; burada yapılan
// session.retrieve + markOrderPaid çağrısı, webhook henüz ulaşmamışsa
// (örn. yerelde `stripe listen` çalışmıyorsa) kullanıcıya doğru sonucu göstermek
// için bir yedek (defense-in-depth) doğrulamadır — tekrar tekrar çağrılsa da güvenlidir.
export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({ searchParams }) {
  const sessionId = (await searchParams)?.session_id;
  const user = await getSessionUser();

  if (!user) {
    return (
      <Wrap title="Giriş gerekli" tone="error">
        <p className="text-sm text-stone-500">Sipariş durumunu görmek için giriş yapmalısın.</p>
        <BackLink />
      </Wrap>
    );
  }
  if (!sessionId) {
    return (
      <Wrap title="Sipariş bulunamadı" tone="error">
        <p className="text-sm text-stone-500">Geçerli bir ödeme oturumu bulunamadı.</p>
        <BackLink />
      </Wrap>
    );
  }

  let orderId = null;
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    // Stripe metadata her zaman string döner; user.id ise number, bu yüzden
    // karşılaştırmadan önce ikisi de aynı tipe çevrilir.
    if (Number(session.metadata?.userId) !== user.id) {
      return (
        <Wrap title="Yetkisiz" tone="error">
          <p className="text-sm text-stone-500">Bu sipariş sana ait değil.</p>
          <BackLink />
        </Wrap>
      );
    }
    if (session.payment_status === "paid") {
      const updated = await markOrderPaid({ stripeSessionId: session.id, paymentIntentId: session.payment_intent });
      orderId = updated?.id ?? Number(session.metadata?.orderId);
    } else {
      orderId = Number(session.metadata?.orderId);
    }
  } catch {
    // Stripe'a ulaşılamadıysa DB'de zaten webhook ile işaretlenmiş olabilir; devam et.
    const fallback = await getOrderByStripeSession(sessionId, user.id);
    orderId = fallback?.id;
  }

  const order = orderId ? await getOrderWithItems(orderId, user.id) : null;
  if (!order) {
    return (
      <Wrap title="Sipariş bulunamadı" tone="error">
        <p className="text-sm text-stone-500">Bu ödeme oturumuna ait bir sipariş bulunamadı.</p>
        <BackLink />
      </Wrap>
    );
  }

  const paid = order.paymentStatus === "paid";
  return (
    <Wrap title={paid ? "Ödeme alındı ✓" : "Ödeme işleniyor…"} tone={paid ? "ok" : "pending"}>
      {paid && <ClearCart />}
      <p className="text-sm text-stone-500">
        Sipariş No: <span className="font-mono text-stone-700">{order.id}</span>
      </p>
      {!paid && (
        <p className="mt-2 text-xs text-amber-600">
          Ödeme onayı henüz işlenmedi. Webhook'un (stripe listen) çalıştığından emin ol; bu sayfayı
          yenilediğinde durum güncellenecektir.
        </p>
      )}
      <div className="mt-5 divide-y divide-stone-200 rounded border border-stone-200">
        {order.items.map((it, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>{it.name} · {it.size} × {it.qty}</span>
            <span className="font-medium">{fmt(it.lineTotal)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between text-sm">
        <span className="text-stone-500">Toplam</span>
        <span className="font-semibold">{fmt(order.total)}</span>
      </div>
      <p className="mt-4 text-xs text-stone-500">
        Faturan ve sipariş durumun <Link href="/account/orders" className="underline hover:text-stone-900">Siparişlerim</Link> sayfasında.
        Kargoya verilene kadar oradan tek tıkla iptal edebilirsin.
      </p>
      <BackLink />
    </Wrap>
  );
}

function Wrap({ title, tone, children }) {
  const dot = { ok: "bg-emerald-500", pending: "bg-amber-500", error: "bg-red-500" }[tone];
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16">
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
          <h1 className="text-lg font-medium">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/" className="mt-6 inline-block text-xs uppercase tracking-wide text-stone-500 hover:text-stone-900">
      ← Mağazaya dön
    </Link>
  );
}
