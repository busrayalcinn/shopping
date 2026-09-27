// Ödeme sağlayıcısına dair her şey bu dosyada. İleride iyzico / PayTR gibi
// Türkiye'de çalışan bir sağlayıcıya geçildiğinde yalnızca burası değişir.
import Stripe from "stripe";

let stripe;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY eksik (.env dosyasına Stripe test secret key'ini koy).");
  if (!stripe) stripe = new Stripe(key);
  return stripe;
}

// Kısmi ya da tam para iadesi. idempotencyKey sayesinde aynı iade iki kez
// tetiklense bile (çift tıklama, yeniden deneme) Stripe yalnızca bir kez iade eder.
export async function refundPayment({ paymentIntentId, amountTL, idempotencyKey }) {
  if (!paymentIntentId) throw new Error("Bu siparişin ödeme kaydı bulunamadı.");
  if (!(amountTL > 0)) throw new Error("İade tutarı geçersiz.");

  return getStripe().refunds.create(
    { payment_intent: paymentIntentId, amount: Math.round(amountTL * 100), reason: "requested_by_customer" },
    { idempotencyKey }
  );
}

// Kullanıcı ödeme sayfasından vazgeçtiğinde oturumu hemen kapatır ki
// rezerve edilen stok 30 dk beklemeden serbest kalsın.
export async function expireCheckoutSession(sessionId) {
  if (!sessionId) return;
  try {
    await getStripe().checkout.sessions.expire(sessionId);
  } catch {
    // Zaten süresi dolmuş / tamamlanmış olabilir; önemli değil.
  }
}
