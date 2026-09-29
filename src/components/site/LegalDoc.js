import PageShell from "@/components/site/PageShell";

// Yasal metinler için ortak düzen.
// NOT: Bu metinler şablondur; yayına almadan önce bir hukukçuya kontrol ettir.
export default function LegalDoc({ title, path, updated = "30 Eylül 2026", children }) {
  return (
    <PageShell title={title} breadcrumbs={[{ name: title, href: path }]}>
      <p className="mt-2 text-sm text-stone-500">Son güncelleme: {updated}</p>
      <div className="mt-8 space-y-6 leading-7 text-stone-700 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-medium [&_h2]:text-stone-900 [&_li]:ml-5 [&_li]:list-disc [&_a]:underline">
        {children}
      </div>
    </PageShell>
  );
}

export function SellerBlock({ seller }) {
  return (
    <ul>
      <li>Unvan: {seller.name}</li>
      <li>Adres: {seller.address}</li>
      <li>Vergi dairesi / numarası: {seller.taxOffice} / {seller.taxId}</li>
      <li>E-posta: {seller.email}</li>
    </ul>
  );
}
