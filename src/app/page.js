import { getProducts } from "@/lib/db";
import Store from "@/components/Store";
import SiteFooter from "@/components/site/SiteFooter";
import JsonLd from "@/components/site/JsonLd";
import { SITE, absoluteUrl, telHref } from "@/lib/site";

// Sayfa önbellekten sunulur ve en geç 60 saniyede bir yenilenir (hızlı açılış).
// Oturum bilgisi tarayıcıda /api/auth/me ile alınır; stok, ödemede sunucuda yeniden doğrulanır.
export const revalidate = 60;

export const metadata = {
  alternates: { canonical: "/" },
};

export default async function Page() {
  const products = await getProducts();
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "OnlineStore",
            name: SITE.name,
            url: absoluteUrl("/"),
            description: SITE.description,
            ...(SITE.email && { email: SITE.email }),
            ...(SITE.phone && { telephone: telHref().replace("tel:", "") }),
            hasMerchantReturnPolicy: {
              "@type": "MerchantReturnPolicy",
              applicableCountry: "TR",
              returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
              merchantReturnDays: 14,
              returnMethod: "https://schema.org/ReturnByMail",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE.name,
            url: absoluteUrl("/"),
            inLanguage: "tr-TR",
          },
        ]}
      />
      <Store products={products} footer={<SiteFooter />} />
    </>
  );
}
