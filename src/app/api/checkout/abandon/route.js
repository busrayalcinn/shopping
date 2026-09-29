import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { abandonCheckout } from "@/lib/orders";

// POST /api/checkout/abandon   Body: { orderId }
// Kullanıcı ödeme sayfasından tarayıcının geri tuşuyla mağazaya döndüğünde
// çağrılır. Yalnızca kullanıcının kendi, hâlâ ödeme bekleyen siparişini kapatır;
// ödeme aslında tamamlanmışsa siparişi ödendi olarak işaretler.
export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const orderId = Number(body.orderId);
  if (!Number.isInteger(orderId)) return NextResponse.json({ error: "Geçersiz sipariş." }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    select: { id: true, status: true, stripeSessionId: true },
  });
  if (!order) return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });

  const result = await abandonCheckout(order, "Ödeme sayfasından geri dönüldü, sipariş kapatıldı.");
  if (result === "expired") revalidatePath("/", "layout"); // vitrindeki stok hemen güncellensin
  return NextResponse.json({ ok: true, result });
}
