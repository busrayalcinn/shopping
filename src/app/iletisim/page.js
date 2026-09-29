import { Phone, Mail, MapPin, Clock } from "lucide-react";
import PageShell from "@/components/site/PageShell";
import JsonLd from "@/components/site/JsonLd";
import { SITE, telHref, absoluteUrl } from "@/lib/site";
import { SELLER } from "@/lib/invoice";

export const metadata = {
  title: "İletişim",
  description: `${SITE.name} müşteri hizmetleri: sipariş, iade ve beden soruların için telefon ve e-posta ile bize ulaş. ${SITE.hours}.`,
  alternates: { canonical: "/iletisim" },
};

export default function ContactPage() {
  const address = SITE.address || SELLER.address;
  const rows = [
    SITE.phone && { icon: Phone, label: "Telefon", value: SITE.phone, href: telHref() },
    SITE.email && { icon: Mail, label: "E-posta", value: SITE.email, href: `mailto:${SITE.email}` },
    { icon: Clock, label: "Çalışma saatleri", value: SITE.hours },
    address && {
      icon: MapPin,
      label: "Adres",
      value: address,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
    },
  ].filter(Boolean);

  return (
    <PageShell title="İletişim" breadcrumbs={[{ name: "İletişim", href: "/iletisim" }]}>
      <p className="mt-4 text-stone-600">
        Sipariş, iade ya da beden seçimiyle ilgili her sorunda bize ulaşabilirsin. Siparişinle ilgili yazıyorsan sipariş numaranı eklersen daha hızlı yardımcı oluruz.
      </p>

      <ul className="mt-8 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
        {rows.map(({ icon: Icon, label, value, href }) => (
          <li key={label} className="flex items-start gap-4 p-5">
            <Icon size={20} className="mt-0.5 shrink-0 text-stone-500" aria-hidden="true" />
            <div>
              <p className="text-sm text-stone-500">{label}</p>
              {href ? (
                <a href={href} className="font-medium hover:underline" {...(href.startsWith("http") && { target: "_blank", rel: "noopener" })}>{value}</a>
              ) : (
                <p className="font-medium">{value}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <section className="mt-10 text-sm text-stone-600">
        <h2 className="text-lg font-medium text-stone-900">Satıcı bilgileri</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-[auto_1fr]">
          <dt className="text-stone-500">Unvan</dt><dd>{SELLER.name}</dd>
          <dt className="text-stone-500">Adres</dt><dd>{SELLER.address}</dd>
          <dt className="text-stone-500">Vergi dairesi / no</dt><dd>{SELLER.taxOffice} / {SELLER.taxId}</dd>
          <dt className="text-stone-500">E-posta</dt><dd>{SELLER.email}</dd>
        </dl>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          url: absoluteUrl("/iletisim"),
          mainEntity: {
            "@type": "Organization",
            name: SITE.name,
            url: absoluteUrl("/"),
            ...(SITE.email && { email: SITE.email }),
            ...(SITE.phone && {
              contactPoint: {
                "@type": "ContactPoint",
                telephone: telHref().replace("tel:", ""),
                contactType: "customer service",
                areaServed: "TR",
                availableLanguage: "Turkish",
              },
            }),
          },
        }}
      />
    </PageShell>
  );
}
