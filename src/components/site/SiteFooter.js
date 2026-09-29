import Link from "next/link";
import { SITE, LEGAL_LINKS, telHref } from "@/lib/site";
import PhoneCta from "./PhoneCta";

// Tüm vitrin sayfalarında ortak alt bilgi + sabit telefon butonu.
export default function SiteFooter() {
  const tel = telHref(SITE.phone);
  return (
    <>
      <footer className="border-t border-stone-900/10 bg-stone-100 pb-24 text-sm text-stone-600 print:hidden md:pb-10">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 pt-10 sm:grid-cols-3">
          <div>
            <Link href="/" className="text-lg font-bold uppercase tracking-[0.25em] text-stone-900">
              {SITE.name}
            </Link>
            <p className="mt-2 text-stone-500">{SITE.tagline}</p>
          </div>

          <nav aria-label="Kurumsal">
            <p className="mb-3 text-xs uppercase tracking-widest text-stone-400">Kurumsal</p>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-stone-900">Tüm Ürünler</Link></li>
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}><Link href={l.href} className="hover:text-stone-900">{l.label}</Link></li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="mb-3 text-xs uppercase tracking-widest text-stone-400">Bize ulaşın</p>
            <ul className="space-y-2">
              {tel && <li><a href={tel} className="hover:text-stone-900">{SITE.phone}</a></li>}
              {SITE.email && <li><a href={`mailto:${SITE.email}`} className="hover:text-stone-900">{SITE.email}</a></li>}
              <li className="text-stone-500">{SITE.hours}</li>
            </ul>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-6xl px-5 text-xs text-stone-400">
          © {new Date().getFullYear()} {SITE.name}. Tüm hakları saklıdır.
        </p>
      </footer>
      <PhoneCta />
    </>
  );
}
