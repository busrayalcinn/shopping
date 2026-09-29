import { getProducts } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { SITE } from "@/lib/site";
import { JsonLd, organizationLd, websiteLd } from "@/lib/seo";
import Store from "@/components/Store";

// Oturum çerezine baktığı için bu sayfa istek anında render edilir.
export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: `${SITE.name} — Keten Gömlek, Triko, Jean ve Trençkot | Yeni Sezon` },
  description: SITE.description,
  // ?product=, ?kategori= gibi parametreli adresler ana sayfanın kopyası sayılmasın
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: `${SITE.name} — Yeni Sezon Giyim Koleksiyonu`,
    description: SITE.description,
    images: [{ url: "/products/keten-gomlek-ekru.png", width: 1024, height: 1536, alt: "Atölye yeni sezon koleksiyonu" }],
  },
};

export default async function Page() {
  const products = await getProducts();
  const user = await getSessionUser();
  return (
    <>
      <JsonLd data={organizationLd()} />
      <JsonLd data={websiteLd()} />
      <Store products={products} initialUser={user ? { email: user.email, name: user.name } : null} />
    </>
  );
}
