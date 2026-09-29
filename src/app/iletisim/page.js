import { Mail, MapPin, Phone, Clock } from "lucide-react";
import PageShell from "@/components/site/PageShell";
import { SITE, telHref } from "@/lib/site";
import { JsonLd, organizationLd } from "@/lib/seo";

export const metadata = {
  title: "İletişim",
  description: `${SITE.name} müşteri hizmetleri: sipariş, kargo, iade ve değişim soruların için telefon ve e-posta ile bize ulaş.`,
  alternates: { canonical: "/iletisim" },
};

export default function ContactPage() {
  const tel = telHref(SITE.phone);
  const rows = [
    tel && { icon: Phone, label: "Telefon", value: <a href={tel} className="hover:underline">{SITE.phone}</a> },
    SITE.email && { icon: Mail, label: "E-posta", value: <a href={`mailto:${SITE.email}`} className="hover:underline">{SITE.email}</a> },
    SITE.address && { icon: MapPin, label: "Adres", value: SITE.address },
    { icon: Clock, label: "Çalışma saatleri", value: SITE.hours },
  ].filter(Boolean);

  return (
    <PageShell breadcrumbs={[{ name: "İletişim" }]}>
      <JsonLd data={organizationLd()} />
      <h1 className="text-3xl font-light">İletişim</h1>
      <p className="mt-3 text-sm text-stone-500">
        Sipariş, kargo, iade ve değişim soruların için bize aşağıdaki kanallardan ulaşabilirsin.
        Siparişinle ilgili yazarken sipariş numaranı eklemen işimizi hızlandırır.
      </p>

      <ul className="mt-8 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
        {rows.map(({ icon: Icon, label, value }) => (
          <li key={label} className="flex items-start gap-4 px-5 py-4">
            <Icon size={18} className="mt-0.5 shrink-0 text-stone-400" aria-hidden="true" />
            <div>
              <p className="text-xs uppercase tracking-wide text-stone-400">{label}</p>
              <p className="mt-0.5 text-sm text-stone-800">{value}</p>
            </div>
          </li>
        ))}
      </ul>

      {SITE.legalName && (
        <p className="mt-6 text-xs text-stone-400">
          {SITE.legalName}
          {SITE.taxOffice && SITE.taxId ? ` · ${SITE.taxOffice} V.D. ${SITE.taxId}` : ""}
        </p>
      )}
    </PageShell>
  );
}
