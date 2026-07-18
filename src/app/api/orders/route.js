import { NextResponse } from "next/server";
import { getOrdersForUser } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const bad = (msg, status = 400) => NextResponse.json({ error: msg }, { status });

// GET /api/orders -> SADECE oturum açan kullanıcının kendi siparişleri
// (Sipariş oluşturma artık /api/checkout üzerinden Stripe akışıyla yapılıyor.)
export async function GET() {
  const user = await getSessionUser();
  if (!user) return bad("Giriş yapmalısın.", 401);
  return NextResponse.json(getOrdersForUser(user.id));
}
