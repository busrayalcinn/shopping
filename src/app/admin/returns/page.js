import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminReturnCard from "@/components/admin/AdminReturnCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "İade talepleri" };

const TABS = [
  { key: "open", label: "Bekleyenler", statuses: ["requested", "approved"] },
  { key: "refunded", label: "İade edildi", statuses: ["refunded"] },
  { key: "rejected", label: "Reddedildi", statuses: ["rejected"] },
];

export default async function ReturnsPage({ searchParams }) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/");

  const tabKey = (await searchParams)?.tab || "open";
  const tab = TABS.find((t) => t.key === tabKey) || TABS[0];

  const returns = await prisma.returnRequest.findMany({
    where: { status: { in: tab.statuses } },
    orderBy: { createdAt: tab.key === "open" ? "asc" : "desc" },
    take: 200,
    include: {
      user: { select: { email: true, name: true } },
      order: { select: { id: true, deliveredAt: true } },
      items: { include: { orderItem: true } },
    },
  });

  return (
    <div className="min-h-screen bg-stone-50 p-6 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-stone-400">Admin / İadeler</p>
            <h1 className="text-3xl font-semibold">İade Talepleri</h1>
          </div>
          <Link href="/admin" className="rounded-full border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100">← Dashboard</Link>
        </div>

        <nav className="mb-6 flex gap-2">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/admin/returns?tab=${t.key}`}
              className={`rounded-full border px-4 py-1.5 text-sm ${t.key === tab.key ? "border-stone-900 bg-stone-900 text-stone-50" : "border-stone-300 hover:border-stone-900"}`}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {returns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 p-10 text-center text-stone-500">Bu listede talep yok.</div>
        ) : (
          <div className="space-y-4">
            {returns.map((r) => <AdminReturnCard key={r.id} ret={JSON.parse(JSON.stringify(r))} />)}
          </div>
        )}
      </div>
    </div>
  );
}
