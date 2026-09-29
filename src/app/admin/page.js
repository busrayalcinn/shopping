import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LOW_STOCK } from "@/lib/orderStatus";

export const dynamic = "force-dynamic";
export const metadata = { title: { absolute: "Yönetim Paneli | Atölye" } };

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/");

  const [userCount, todoCount, openReturns, lowStock] = await Promise.all([
    prisma.user.count(),
    prisma.order.count({ where: { status: { in: ["paid", "preparing"] } } }),
    prisma.returnRequest.count({ where: { status: { in: ["requested", "approved"] } } }),
    prisma.productVariant.findMany({
      where: { stock: { lte: LOW_STOCK }, product: { active: true }, color: { active: true } },
      include: { product: { select: { name: true } }, color: { select: { name: true } } },
      orderBy: { stock: "asc" },
      take: 12,
    }),
  ]);

  const stats = [
    { label: "Hazırlanacak sipariş", value: todoCount, href: "/admin/orders?tab=todo", alert: todoCount > 0 },
    { label: "Bekleyen iade talebi", value: openReturns, href: "/admin/returns", alert: openReturns > 0 },
    { label: `Stoğu ${LOW_STOCK} ve altı beden`, value: lowStock.length, href: "/admin/products", alert: lowStock.length > 0 },
    { label: "Toplam kullanıcı", value: userCount, href: "/admin/users" },
  ];

  return (
    <div className="min-h-screen bg-stone-50 p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-stone-400">Admin Panel</p>
            <h1 className="text-3xl font-semibold">Atölye Dashboard</h1>
          </div>
          <div className="rounded-full bg-stone-900 px-4 py-2 text-sm text-stone-50">{user.name || user.email}</div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="rounded-2xl border border-stone-200 bg-white p-5 hover:border-stone-900">
              <p className="text-sm text-stone-500">{s.label}</p>
              <p className={`mt-2 text-4xl font-bold ${s.alert ? "text-stone-900" : "text-stone-400"}`}>{s.value}</p>
            </Link>
          ))}
        </div>

        {lowStock.length > 0 && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-medium text-amber-900">Stok azalıyor</h2>
            <ul className="mt-2 grid gap-1 text-sm text-amber-900 sm:grid-cols-2">
              {lowStock.map((v) => (
                <li key={v.id}>
                  {v.product.name} · {v.color.name} · {v.size}: <strong>{v.stock === 0 ? "tükendi" : `${v.stock} adet`}</strong>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 grid gap-3 md:grid-cols-4">
          {[
            ["/admin/orders", "Siparişler", "Hazırla, kargola, iptal et"],
            ["/admin/returns", "İadeler", "Talepleri onayla, para iadesi yap"],
            ["/admin/products", "Ürünler ve stok", "Ürün ekle, beden stoklarını güncelle"],
            ["/admin/users", "Kullanıcılar", "Roller ve hesaplar"],
          ].map(([href, title, desc]) => (
            <Link key={href} href={href} className="rounded-xl border border-stone-200 bg-white p-4 hover:border-stone-900">
              <p className="font-medium">{title}</p>
              <p className="text-sm text-stone-500">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
