import { SITE, absoluteUrl } from "@/lib/site";

// Google zengin sonuçları için JSON-LD. "<" kaçırılır ki metin içindeki
// "</script>" etiketi sayfayı bozmasın.
export function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function breadcrumbLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      ...(it.href ? { item: absoluteUrl(it.href) } : {}),
    })),
  };
}

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    ...(SITE.legalName ? { legalName: SITE.legalName } : {}),
    ...(SITE.email ? { email: SITE.email } : {}),
    ...(SITE.phone ? { telephone: SITE.phone } : {}),
    ...(SITE.address ? { address: { "@type": "PostalAddress", streetAddress: SITE.address, addressCountry: "TR" } } : {}),
    ...(SITE.phone || SITE.email
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            areaServed: "TR",
            availableLanguage: "Turkish",
            ...(SITE.phone ? { telephone: SITE.phone } : {}),
            ...(SITE.email ? { email: SITE.email } : {}),
          },
        }
      : {}),
    hasMerchantReturnPolicy: returnPolicyLd(),
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    inLanguage: "tr-TR",
  };
}

// Mağazanın iade kuralı: teslimattan sonra 14 gün, kargoyla.
// İade kargosu ücretsizse returnFees: "https://schema.org/FreeReturn" eklenebilir.
export function returnPolicyLd() {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "TR",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 14,
    returnMethod: "https://schema.org/ReturnByMail",
    merchantReturnLink: absoluteUrl("/iade-ve-degisim"),
  };
}
