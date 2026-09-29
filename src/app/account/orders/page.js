import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/orders";
import OrdersView from "@/components/account/OrdersView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Siparişlerim" };

export default async function MyOrdersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/?login=1");

  const orders = await getOrdersForUser(user.id);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-900/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-xl font-bold uppercase tracking-[0.25em]">Atölye</Link>
          <Link href="/" className="text-sm text-stone-500 hover:text-stone-900">Alışverişe dön</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-3xl font-light">Siparişlerim</h1>
        <p className="mt-2 text-sm text-stone-500">
          Kargoya verilene kadar siparişini buradan iptal edebilir, teslimattan sonraki 14 gün içinde iade talebi oluşturabilirsin.
        </p>
        {/* Tarihler istemciye string olarak geçer */}
        <OrdersView orders={JSON.parse(JSON.stringify(orders))} />
      </main>
    </div>
  );
}
