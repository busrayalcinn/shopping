import Link from "next/link";
import PageShell from "@/components/site/PageShell";
import { LEGAL_LINKS } from "@/lib/site";

export const metadata = {
  title: "Sayfa bulunamadı",
};

export default function NotFound() {
  return (
    <PageShell>
      <div className="py-16 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Hata 404</p>
        <h1 className="mt-3 text-4xl font-light">Aradığın sayfa bulunamadı</h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-stone-500">
          Bağlantı eskimiş, ürün satıştan kaldırılmış ya da adres yanlış yazılmış olabilir.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-stone-50 hover:bg-stone-700"
        >
          Koleksiyona göz at
        </Link>
        <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-stone-500">
          {LEGAL_LINKS.map((l) => (
            <li key={l.href}><Link href={l.href} className="hover:text-stone-900 hover:underline">{l.label}</Link></li>
          ))}
        </ul>
      </div>
    </PageShell>
  );
}
