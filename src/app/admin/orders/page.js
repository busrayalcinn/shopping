import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ORDER_STATUS } from "@/lib/orderStatus";
import AdminOrderCard from "@/components/admin/AdminOrderCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Siparişler" };

const TABS = [
  { key: "todo", label: "Yapılacaklar", where: { status: { in: ["paid", "preparing"] } } },
  { key: "shipped", label: "Kargoda", where: { status: "shipped" } },
  { key: "delivered", label: "Teslim edildi", where: { status: "delivered" } },
  { key: "cancelled", label: "İptal", where: { status: "cancelled" } },
  { key: "all", label: "Tümü", where: { status: { not: "expired" } } },
];

export default async function OrdersPage({ searchParams }) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/");

  const tabKey = (await searchParams)?.tab || "todo";
  const tab = TABS.find((t) => t.key === tabKey) || TABS[0];

  const [orders, counts] = await Promise.all([
    prisma.order.findMany({
      where: tab.where,
      orderBy: { createdAt: tab.key === "todo" ? "asc" : "desc" }, // yapılacaklarda en eski sipariş üstte
      take: 200,
      include: {
        user: { select: { name: true, email: true } },
        items: true,
        invoice: { select: { number: true, status: true } },
        events: { where: { type: "refund_failed" }, select: { id: true } },
      },
    }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const countOf = (statuses) => counts.filter((c) => statuses.includes(c.status)).reduce((s, c) => s + c._count, 0);

  return (
    <div className="min-h-screen bg-stone-50 p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-stone-400">Admin / Siparişler</p>
            <h1 className="text-3xl font-semibold">Sipariş Yönetimi</h1>
          </div>
          <Link href="/admin" className="rounded-full border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100">← Dashboard</Link>
        </div>

        <nav className="mb-6 flex flex-wrap gap-2">
          {TABS.map((t) => {
            const n = t.key === "todo" ? countOf(["paid", "preparing"]) : t.key === "all" ? null : countOf([t.key]);
            return (
              <Link
                key={t.key}
                href={`/admin/orders?tab=${t.key}`}
                className={`rounded-full border px-4 py-1.5 text-sm ${t.key === tab.key ? "border-stone-900 bg-stone-900 text-stone-50" : "border-stone-300 hover:border-stone-900"}`}
              >
                {t.label}{n !== null && <span className="ml-1.5 opacity-60">{n}</span>}
              </Link>
            );
          })}
        </nav>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 p-10 text-center text-stone-500">
            {tab.key === "todo" ? "Hazırlanacak sipariş yok." : "Bu durumda sipariş yok."}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <AdminOrderCard
                key={o.id}
                order={JSON.parse(JSON.stringify({ ...o, refundFailed: o.events.length > 0 && o.refundedAmount < o.total }))}
                statusLabel={ORDER_STATUS[o.status]?.label || o.status}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
