import Link from "next/link";
import { SITE } from "@/lib/site";
import { CATEGORIES, categoryPath } from "@/lib/seo";
import SiteFooter from "@/components/site/SiteFooter";
import Breadcrumbs from "@/components/site/Breadcrumbs";

// Bilgi sayfaları (iletişim, yasal metinler, 404) için ortak çerçeve
export default function PageShell({ title, breadcrumbs, children, narrow = true }) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900">
      <header className="border-b border-stone-900/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
          <Link href="/" className="text-xl font-bold uppercase tracking-[0.25em]">{SITE.name}</Link>
          <nav aria-label="Kategoriler" className="hidden gap-6 text-sm md:flex">
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={categoryPath(c.name)} className="uppercase tracking-wide text-stone-500 hover:text-stone-900">
                {c.name}
              </Link>
            ))}
          </nav>
          <Link href="/" className="text-sm text-stone-500 hover:text-stone-900 md:hidden">Mağaza</Link>
        </div>
      </header>

      <main className={`mx-auto w-full flex-1 px-5 py-10 ${narrow ? "max-w-3xl" : "max-w-6xl"}`}>
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        {title && <h1 className="mt-4 text-3xl font-light md:text-4xl">{title}</h1>}
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
