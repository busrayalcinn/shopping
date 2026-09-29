import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { abandonCheckout } from "@/lib/orders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ödeme tamamlanmadı" };

// Kullanıcı Stripe ödeme sayfasında "geri dön"e basarsa cancel_url burası olur.
// Ödeme oturumu hemen kapatılır ve bu sipariş için ayrılan stok serbest bırakılır;
// böylece ürünler 30 dakika boyunca başkalarına "tükendi" görünmez.
export default async function OrderCancelPage({ searchParams }) {
  const orderId = Number((await searchParams)?.order_id);
  const user = await getSessionUser();

  if (user && Number.isInteger(orderId)) {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id, status: "pending" } });
    if (order) await abandonCheckout(order, "Ödeme sayfasından vazgeçildi.");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16 text-center">
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-6">
        <h1 className="text-lg font-medium">Ödeme tamamlanmadı</h1>
        <p className="mt-2 text-sm text-stone-500">
          Kartından herhangi bir tutar çekilmedi. Sepetin hâlâ duruyor, istediğin zaman tekrar deneyebilirsin.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 hover:bg-stone-700"
        >
          Mağazaya dön
        </Link>
      </div>
    </div>
  );
}
