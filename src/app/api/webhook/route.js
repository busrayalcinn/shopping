import { NextResponse } from "next/server";
import { getStripe } from "@/lib/payments";
import { markOrderPaid, expireOrderBySession } from "@/lib/orders";

// İmza doğrulaması ham (raw) body ister.
export const runtime = "nodejs";

// POST /api/webhook — Stripe tarafından çağrılır (kullanıcı tarayıcısından değil).
// Yerelde test etmek için: `stripe listen --forward-to localhost:3000/api/webhook`
// komutunun verdiği whsec_... değerini .env'deki STRIPE_WEBHOOK_SECRET'a koy.
export async function POST(req) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET eksik." }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    // İmza uyuşmuyor: ya secret yanlış ya da istek Stripe'tan gelmiyor.
    return NextResponse.json({ error: `Webhook imza hatası: ${err.message}` }, { status: 400 });
  }

  try {
    const session = event.data.object;
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        if (session.payment_status === "paid") {
          await markOrderPaid({ stripeSessionId: session.id, paymentIntentId: session.payment_intent });
        }
        break;
      case "checkout.session.expired":
        // Ödeme yapılmadan süre doldu: rezerve edilen stoğu geri bırak.
        await expireOrderBySession(session.id);
        break;
    }
  } catch (err) {
    // 500 dönersek Stripe olayı daha sonra tekrar gönderir; işlemler idempotent olduğu için güvenli.
    console.error("Webhook işlenemedi:", err);
    return NextResponse.json({ error: "İşlenemedi" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
