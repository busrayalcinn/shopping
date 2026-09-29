import Link from "next/link";
import { ChevronRight } from "lucide-react";
import JsonLd from "@/components/site/JsonLd";
import { absoluteUrl } from "@/lib/site";

// Sayfa işaret yolu: hem ziyaretçiye gösterilir hem Google'a BreadcrumbList olarak bildirilir.
// items: [{ name, href }]  — son öğe bulunulan sayfadır.
export default function Breadcrumbs({ items }) {
  const all = [{ name: "Ana sayfa", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Sayfa yolu" className="text-xs text-stone-500">
        <ol className="flex flex-wrap items-center gap-1">
          {all.map((it, i) => {
            const last = i === all.length - 1;
            return (
              <li key={it.href} className="flex items-center gap-1">
                {last ? (
                  <span aria-current="page" className="text-stone-800">{it.name}</span>
                ) : (
                  <Link href={it.href} className="hover:text-stone-900 hover:underline">{it.name}</Link>
                )}
                {!last && <ChevronRight size={12} className="text-stone-400" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((it, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: it.name,
            item: absoluteUrl(it.href),
          })),
        }}
      />
    </>
  );
}
