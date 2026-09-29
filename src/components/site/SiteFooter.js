import Link from "next/link";
import { SITE, telHref } from "@/lib/site";
import { SELLER } from "@/lib/invoice";
import { CATEGORIES, categoryPath } from "@/lib/seo";
import StickyCall from "@/components/site/StickyCall";

export const LEGAL_LINKS = [
  { href: "/iade-ve-degisim", label: "İade ve Değişim" },
  { href: "/mesafeli-satis-sozlesmesi", label: "Mesafeli Satış Sözleşmesi" },
  { href: "/on-bilgilendirme-formu", label: "Ön Bilgilendirme Formu" },
  { href: "/kvkk", label: "Gizlilik ve KVKK Aydınlatma Metni" },
  { href: "/cerez-politikasi", label: "Çerez Politikası" },
];

// Sunucu bileşeni: satıcı bilgilerini (.env) okur. İstemci bileşenlerine prop olarak verilebilir.
export default function SiteFooter() {
  return (
    <>
      <footer className="border-t border-stone-900/10 bg-stone-100/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="text-lg font-bold uppercase tracking-[0.25em]">{SITE.name}</Link>
            <p className="mt-3 text-stone-500">{SITE.tagline}</p>
          </div>

          <nav aria-label="Kategoriler">
            <p className="mb-3 font-medium">Alışveriş</p>
            <ul className="space-y-2 text-stone-600">
              <li><Link href="/" className="hover:text-stone-900">Tüm ürünler</Link></li>
              {CATEGORIES.map((c) => (
                <li key={c.slug}><Link href={categoryPath(c.name)} className="hover:text-stone-900">{c.name}</Link></li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Yardım ve yasal bilgiler">
            <p className="mb-3 font-medium">Yardım</p>
            <ul className="space-y-2 text-stone-600">
              <li><Link href="/iletisim" className="hover:text-stone-900">İletişim</Link></li>
              <li><Link href="/account/orders" className="hover:text-stone-900" rel="nofollow">Siparişlerim</Link></li>
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}><Link href={l.href} className="hover:text-stone-900">{l.label}</Link></li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="mb-3 font-medium">İletişim</p>
            <address className="space-y-2 not-italic text-stone-600">
              {SITE.phone && <p><a href={telHref()} className="hover:text-stone-900">{SITE.phone}</a></p>}
              {SITE.email && <p><a href={`mailto:${SITE.email}`} className="hover:text-stone-900">{SITE.email}</a></p>}
              <p>{SITE.hours}</p>
            </address>
          </div>
        </div>
        <div className="border-t border-stone-900/10">
          <p className="mx-auto max-w-6xl px-5 py-4 text-xs text-stone-500">
            © {new Date().getFullYear()} {SELLER.name} · {SELLER.address} · {SELLER.taxOffice} V.D. {SELLER.taxId}
          </p>
        </div>
      </footer>
      <StickyCall />
    </>
  );
}
