import { getProducts } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import { CATEGORIES, categoryPath, productPath } from "@/lib/seo";

export const revalidate = 3600; // saatte bir yenilenir

// /sitemap.xml — Google'a indekslenecek tüm sayfaları bildirir
export default async function sitemap() {
  const products = await getProducts().catch(() => []);
  const now = new Date();

  const staticPages = ["/iletisim", "/iade-ve-degisim", "/mesafeli-satis-sozlesmesi", "/on-bilgilendirme-formu", "/kvkk", "/cerez-politikasi"];

  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    ...CATEGORIES.map((c) => ({ url: absoluteUrl(categoryPath(c.name)), lastModified: now, changeFrequency: "daily", priority: 0.8 })),
    ...products.map((p) => ({
      url: absoluteUrl(productPath(p)),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
      images: p.colors.filter((c) => c.imageUrl).map((c) => absoluteUrl(c.imageUrl)),
    })),
    ...staticPages.map((path) => ({ url: absoluteUrl(path), lastModified: now, changeFrequency: "yearly", priority: 0.3 })),
  ];
}
