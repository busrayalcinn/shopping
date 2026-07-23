import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminPage() {
  const user = await getSessionUser();

  // Giriş yoksa login'e
  if (!user) {
    redirect("/");
  }

  // Admin değilse ana sayfaya
  if (user.role !== "admin") {
    redirect("/");
  }

  const [userCount, orderCount] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
  ]);

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-stone-400">
              Admin Panel
            </p>
            <h1 className="text-3xl font-semibold">Atölye Dashboard</h1>
          </div>
          <div className="rounded-full bg-stone-900 px-4 py-2 text-sm text-stone-50">
            {user.name || user.email}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <p className="text-sm text-stone-500">Toplam Kullanıcı</p>
            <p className="mt-2 text-4xl font-bold">{userCount}</p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <p className="text-sm text-stone-500">Toplam Sipariş</p>
            <p className="mt-2 text-4xl font-bold">{orderCount}</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Yönetim</h2>

          <div className="grid gap-3 md:grid-cols-3">
            <a
              href="/admin/products"
              className="rounded-xl border border-stone-200 p-4 hover:border-stone-900 hover:bg-stone-50"
            >
              <p className="font-medium">Ürünler</p>
              <p className="text-sm text-stone-500">
                Ürün ekle, düzenle, sil
              </p>
            </a>

            <a
              href="/admin/orders"
              className="rounded-xl border border-stone-200 p-4 hover:border-stone-900 hover:bg-stone-50"
            >
              <p className="font-medium">Siparişler</p>
              <p className="text-sm text-stone-500">
                Siparişleri yönet
              </p>
            </a>

            <a
              href="/admin/users"
              className="rounded-xl border border-stone-200 p-4 hover:border-stone-900 hover:bg-stone-50"
            >
              <p className="font-medium">Kullanıcılar</p>
              <p className="text-sm text-stone-500">
                Roller ve hesaplar
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}