import PageShell from "./PageShell";
import { SITE } from "@/lib/site";

// Yasal metinlerin ortak düzeni. Satıcı bilgileri .env'deki SELLER_* değerlerinden gelir.
export default function LegalPage({ title, updated, children }) {
  return (
    <PageShell breadcrumbs={[{ name: title }]}>
      <article className="legal space-y-4 text-sm leading-7 text-stone-700">
        <h1 className="text-3xl font-light text-stone-900">{title}</h1>
        {updated && <p className="text-xs text-stone-400">Son güncelleme: {updated}</p>}
        {children}
      </article>
    </PageShell>
  );
}

export function H2({ children }) {
  return <h2 className="pt-4 text-lg font-medium text-stone-900">{children}</h2>;
}

export function SellerInfo() {
  return (
    <ul className="list-disc space-y-1 pl-5">
      <li><strong>Unvan:</strong> {SITE.legalName || `${SITE.name} (unvan eklenecek)`}</li>
      {SITE.address && <li><strong>Adres:</strong> {SITE.address}</li>}
      {SITE.taxOffice && SITE.taxId && <li><strong>Vergi dairesi / no:</strong> {SITE.taxOffice} / {SITE.taxId}</li>}
      {SITE.email && <li><strong>E-posta:</strong> <a href={`mailto:${SITE.email}`} className="underline">{SITE.email}</a></li>}
      {SITE.phone && <li><strong>Telefon:</strong> {SITE.phone}</li>}
    </ul>
  );
}
