import { NextResponse } from "next/server";
import { getOrdersForUser } from "@/lib/orders";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/orders -> SADECE oturum açan kullanıcının kendi siparişleri
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
  return NextResponse.json(await getOrdersForUser(user.id));
}
