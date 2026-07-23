import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProductsPage() {
  const user = await getSessionUser();

  if (!user || user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-stone-400">
              Admin / Ürünler
            </p>
            <h1 className="text-3xl font-semibold">Ürün Yönetimi</h1>
          </div>

          <a
            href="/admin"
            className="rounded-full border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100"
          >
            ← Dashboard
          </a>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center">
          <h2 className="text-xl font-semibold">Ürünler</h2>
          <p className="mt-2 text-stone-500">
            Ürünler burada listelenecek ve yönetilecek.
          </p>
        </div>
      </div>
    </div>
  );
}