import { prisma } from "@/lib/db";
import { SITE, productPath, LEGAL_LINKS } from "@/lib/site";

// /sitemap.xml — her istekte güncel ürün listesiyle üretilir (en fazla saatte bir).
export const revalidate = 3600;

export default async function sitemap() {
  const now = new Date();
  const pages = [
    { url: SITE.url, lastModified: now, changeFrequency: "daily", priority: 1 },
    ...LEGAL_LINKS.map((l) => ({ url: `${SITE.url}${l.href}`, changeFrequency: "yearly", priority: 0.3 })),
  ];

  let products = [];
  try {
    products = await prisma.product.findMany({
      where: { active: true, colors: { some: { active: true } } },
      select: { id: true, name: true, createdAt: true },
      orderBy: { id: "asc" },
    });
  } catch (err) {
    // Veritabanına ulaşılamazsa (örn. build sırasında) statik sayfalarla devam et
    console.error("sitemap: ürünler okunamadı", err.message);
  }

  return [
    ...pages,
    ...products.map((p) => ({
      url: `${SITE.url}${productPath(p)}`,
      lastModified: p.createdAt,
      changeFrequency: "weekly",
      priority: 0.8,
    })),
  ];
}
