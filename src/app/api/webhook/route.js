import { NextResponse } from "next/server";
import Stripe from "stripe";
import { markOrderPaidBySession } from "@/lib/db";

// Next.js'in body parser'ı burada devre dışı; imza doğrulaması ham (raw) body ister.
export const runtime = "nodejs";

// POST /api/webhook — Stripe tarafından çağrılır (kullanıcı tarayıcısından değil).
// Yerelde test etmek için: `stripe listen --forward-to localhost:3000/api/webhook`
// komutunun verdiği whsec_... değerini .env'deki STRIPE_WEBHOOK_SECRET'a koy.
export async function POST(req) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) {
    return NextResponse.json({ error: "Stripe env değişkenleri eksik." }, { status: 500 });
  }

  const stripe = new Stripe(key);
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    // İmza uyuşmuyor: ya secret yanlış ya da istek Stripe'tan gelmiyor.
    return NextResponse.json({ error: `Webhook imza hatası: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      markOrderPaidBySession(session.id);
    }
  }

  // Stripe yalnızca 2xx aldığında olayı "işlendi" sayar; hızlıca yanıt dönülür.
  return NextResponse.json({ received: true });
}
