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
    include: {
      user: { select: { name: true, email: true } },
      items: true,
    },
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
                <div key={order.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sipariş #{order.id}</p>
                      <p className="text-sm text-stone-500">
                        {new Date(order.createdAt).toLocaleString("tr-TR")}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        {order.user?.name || order.customerName || "—"}
                        {order.user?.email ? ` · ${order.user.email}` : ""}
                      </p>
                      <p className="text-xs text-stone-400">{order.address}</p>
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

                  {order.items.length > 0 && (
                    <div className="mt-3 rounded-lg bg-stone-50 px-4 py-3">
                      <ul className="space-y-1 text-sm text-stone-600">
                        {order.items.map((it) => (
                          <li key={it.id} className="flex justify-between">
                            <span>
                              {it.name} · {it.size} × {it.qty}
                            </span>
                            <span className="font-medium text-stone-800">
                              {Number(it.lineTotal).toLocaleString("tr-TR")} ₺
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}