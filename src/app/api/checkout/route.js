import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createOrder, attachStripeSession } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { validateCart } from "@/lib/cart";

const bad = (msg, status = 400) => NextResponse.json({ error: msg }, { status });

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY eksik (.env dosyasına Stripe test secret key'ini koy).");
  return new Stripe(key);
}

// POST /api/checkout  (oturum gerekli)
// Body: { items: [{ id, size, qty }], customer: { name, address } }
// Akış:
//   1) Sepet sunucuda yeniden doğrulanır/fiyatlandırılır (istemciye güvenilmez).
//   2) Siparişin ilk hali 'pending' ödeme durumuyla veritabanına yazılır.
//   3) Stripe Checkout Session açılır, sipariş bu session'a bağlanır.
//   4) Kullanıcı Stripe'ın barındırdığı ödeme sayfasına yönlendirilir.
// Ödemenin gerçekten tamamlandığı bilgisi /api/webhook'tan gelir.
export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return bad("Ödeme yapmak için giriş yapmalısın.", 401);

  let body;
  try { body = await req.json(); } catch { return bad("Geçersiz istek gövdesi (JSON bekleniyor)."); }

  const name = typeof body.customer?.name === "string" ? body.customer.name.trim() : "";
  const address = typeof body.customer?.address === "string" ? body.customer.address.trim() : "";
  if (!name) return bad("Ad Soyad zorunlu.");
  if (!address) return bad("Teslimat adresi zorunlu.");

  const { error, lines, total } = validateCart(body.items);
  if (error) return bad(error);
  if (total <= 0) return bad("Sepet tutarı geçersiz.");

  // Sipariş 'pending' ödeme durumuyla oluşturulur; ödeme onaylanınca webhook günceller.
  const order = createOrder({ userId: user.id, name, address, total, lines });

  let session;
  try {
    const stripe = getStripe();
    const origin = new URL(req.url).origin;
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: user.email,
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
      metadata: { orderId: order.id, userId: user.id },
    });
  } catch (e) {
    return bad(e.message || "Stripe oturumu oluşturulamadı.", 502);
  }

  attachStripeSession(order.id, session.id);
  return NextResponse.json({ ok: true, url: session.url });
}
