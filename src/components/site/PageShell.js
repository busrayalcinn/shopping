import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SITE } from "@/lib/site";
import { JsonLd, breadcrumbLd } from "@/lib/seo";
import SiteFooter from "./SiteFooter";

// Ürün, iletişim ve yasal sayfaların ortak iskeleti: üst bar, işaret yolu (breadcrumb), alt bilgi.
// breadcrumbs: [{ name, href? }] — sonuncusu içinde bulunulan sayfadır.
export default function PageShell({ breadcrumbs, children, wide = false }) {
  const crumbs = breadcrumbs ? [{ name: "Ana Sayfa", href: "/" }, ...breadcrumbs] : null;
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900">
      <header className="border-b border-stone-900/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-xl font-bold uppercase tracking-[0.25em]">{SITE.name}</Link>
          <Link href="/" className="text-sm text-stone-500 hover:text-stone-900">Alışverişe dön</Link>
        </div>
      </header>

      <main className={`mx-auto w-full flex-1 px-5 py-8 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
        {crumbs && (
          <>
            <nav aria-label="İşaret yolu" className="mb-6 text-xs text-stone-500">
              <ol className="flex flex-wrap items-center gap-1">
                {crumbs.map((c, i) => {
                  const last = i === crumbs.length - 1;
                  return (
                    <li key={i} className="flex items-center gap-1">
                      {last || !c.href ? (
                        <span aria-current={last ? "page" : undefined} className={last ? "text-stone-800" : ""}>{c.name}</span>
                      ) : (
                        <Link href={c.href} className="hover:text-stone-900 hover:underline">{c.name}</Link>
                      )}
                      {!last && <ChevronRight size={12} aria-hidden="true" />}
                    </li>
                  );
                })}
              </ol>
            </nav>
            <JsonLd data={breadcrumbLd(crumbs)} />
          </>
        )}
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
