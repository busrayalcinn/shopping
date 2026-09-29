import Link from "next/link";
import PageShell from "@/components/site/PageShell";
import { CATEGORIES, categoryPath } from "@/lib/seo";

export const metadata = {
  title: "Sayfa bulunamadı",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <PageShell>
      <div className="py-12 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-stone-400">404</p>
        <h1 className="mt-3 text-3xl font-light md:text-4xl">Aradığın sayfayı bulamadık</h1>
        <p className="mx-auto mt-4 max-w-md text-stone-600">
          Ürün satıştan kalkmış ya da bağlantı değişmiş olabilir. Koleksiyona göz atmaya devam edebilirsin.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link href="/" className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 hover:bg-stone-700">
            Tüm ürünler
          </Link>
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={categoryPath(c.name)} className="rounded-full border border-stone-300 px-5 py-2.5 text-sm hover:border-stone-900">
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
