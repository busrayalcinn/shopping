import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function OrdersPage() {
  const user = await getSessionUser();

  if (!user || user.role !== "admin") {
    redirect("/");
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-stone-400">
              Admin / Siparişler
            </p>
            <h1 className="text-3xl font-semibold">Sipariş Yönetimi</h1>
          </div>

          <a
            href="/admin"
            className="rounded-full border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100"
          >
            ← Dashboard
          </a>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
          <div className="border-b border-stone-200 px-6 py-4">
            <h2 className="font-semibold">Tüm Siparişler ({orders.length})</h2>
          </div>

          {orders.length === 0 ? (
            <div className="p-10 text-center text-stone-500">
              Henüz sipariş yok.
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div>
                    <p className="font-medium">Sipariş #{order.id}</p>
                    <p className="text-sm text-stone-500">
                      {new Date(order.createdAt).toLocaleString("tr-TR")}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">
                      {Number(order.total).toLocaleString("tr-TR")} ₺
                    </p>
                    <span className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}