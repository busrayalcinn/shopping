import Link from "next/link";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { Check } from "lucide-react";
import { getProducts } from "@/lib/db";
import { SIZES } from "@/lib/constants";
import { SITE, absoluteUrl } from "@/lib/site";
import { categoryPath, productPath, productIdFromSlug, clip } from "@/lib/seo";
import { CAMPAIGN, isCampaignProduct } from "@/lib/campaign";
import { RETURN_WINDOW_DAYS } from "@/lib/orderStatus";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import JsonLd from "@/components/site/JsonLd";
import PageShell from "@/components/site/PageShell";
import ProductGallery from "@/components/site/ProductGallery";

export const revalidate = 60;

const fmt = (n) => `${n.toLocaleString("tr-TR")} ₺`;

async function findProduct(slug) {
  const id = productIdFromSlug(slug);
  if (!id) return { product: null, all: [] };
  const all = await getProducts();
  return { product: all.find((p) => p.id === id) || null, all };
}

function describe(p) {
  const colors = p.colors.map((c) => c.name).join(", ");
  return `${p.name}, Atölye ${p.cat.toLocaleLowerCase("tr-TR")} koleksiyonundan. ${colors} renk seçenekleri ve XS–XL bedenlerle, ${fmt(p.price)}. Kargoya verilene kadar tek tıkla iptal, ${RETURN_WINDOW_DAYS} gün içinde kolay iade.`;
}

export async function generateStaticParams() {
  const products = await getProducts().catch(() => []);
  return products.map((p) => ({ slug: productPath(p).split("/").pop() }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { product: p } = await findProduct(slug);
  if (!p) return { title: "Ürün bulunamadı", robots: { index: false } };
  const image = p.colors.find((c) => c.imageUrl)?.imageUrl;
  return {
    title: `${p.name} – ${p.cat}`,
    description: clip(describe(p)),
    alternates: { canonical: productPath(p) },
    openGraph: {
      type: "website",
      title: p.name,
      description: clip(describe(p)),
      url: productPath(p),
      ...(image && { images: [{ url: image, alt: p.name }] }),
    },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const { product: p, all } = await findProduct(slug);
  if (!p) notFound();
  // Ürün adı değiştiyse eski adres yeni adrese yönlenir
  if (productPath(p) !== `/urun/${slug}`) permanentRedirect(productPath(p));

  const related = all.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 4);
  const inStockSizes = SIZES.filter((s) => p.colors.some((c) => c.stock[s] > 0));
  const images = p.colors.filter((c) => c.imageUrl).map((c) => absoluteUrl(c.imageUrl));

  return (
    <PageShell narrow={false}>
      <Breadcrumbs items={[{ name: p.cat, href: categoryPath(p.cat) }, { name: p.name, href: productPath(p) }]} />

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <ProductGallery name={p.name} colors={p.colors} />

        <div>
          <Link href={categoryPath(p.cat)} className="text-xs uppercase tracking-[0.25em] text-stone-400 hover:text-stone-700">{p.cat}</Link>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">{p.name}</h1>
          <p className="mt-3 text-2xl">{fmt(p.price)}</p>
          {isCampaignProduct(p) && (
            <p className="mt-3 inline-block rounded-full bg-rose-100 px-3 py-1 text-xs text-rose-900">{CAMPAIGN.label}</p>
          )}

          <p className="mt-6 leading-7 text-stone-600">{describe(p)}</p>

          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex gap-2"><dt className="text-stone-500">Renkler:</dt><dd>{p.colors.map((c) => c.name).join(", ")}</dd></div>
            <div className="flex gap-2">
              <dt className="text-stone-500">Stoktaki bedenler:</dt>
              <dd>{inStockSizes.length ? inStockSizes.join(", ") : "Şu an tükendi"}</dd>
            </div>
          </dl>

          {p.soldOut ? (
            <p className="mt-8 inline-block rounded-full bg-stone-200 px-8 py-4 text-stone-600">Tüm renk ve bedenler tükendi</p>
          ) : (
            <Link href={`/?product=${p.id}`} className="mt-8 inline-block rounded-full bg-stone-900 px-8 py-4 text-sm font-medium text-stone-50 hover:bg-stone-700">
              Renk ve beden seç, sepete ekle
            </Link>
          )}

          <ul className="mt-8 space-y-2 text-sm text-stone-600">
            {[
              "Kart bilgin güvenli ödeme sayfasında alınır",
              "Kargoya verilene kadar tek tıkla iptal",
              `${RETURN_WINDOW_DAYS} gün içinde kolay iade`,
            ].map((t) => (
              <li key={t} className="flex items-center gap-2"><Check size={15} className="text-emerald-700" aria-hidden="true" />{t}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-stone-500">
            Sorun mu var? <Link href="/iletisim" className="underline hover:text-stone-900">Bize ulaş</Link> ·{" "}
            <Link href="/iade-ve-degisim" className="underline hover:text-stone-900">İade koşulları</Link>
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="related">
          <h2 id="related" className="text-xl font-medium">Bunlar da ilgini çekebilir</h2>
          <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-4">
            {related.map((r) => {
              const img = r.colors.find((c) => c.imageUrl);
              return (
                <Link key={r.id} href={productPath(r)} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl" style={{ background: r.colors[0]?.hex }}>
                    {img && (
                      <Image src={img.imageUrl} alt={`${r.name} — ${img.name}`} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover transition duration-300 group-hover:scale-105" />
                    )}
                  </div>
                  <p className="mt-2 text-sm">{r.name}</p>
                  <p className="text-sm font-medium">{fmt(r.price)}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: describe(p),
          sku: String(p.id),
          category: p.cat,
          color: p.colors.map((c) => c.name).join(", "),
          ...(images.length && { image: images }),
          brand: { "@type": "Brand", name: SITE.name },
          offers: {
            "@type": "Offer",
            url: absoluteUrl(productPath(p)),
            priceCurrency: "TRY",
            price: String(p.price),
            itemCondition: "https://schema.org/NewCondition",
            availability: p.soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            seller: { "@type": "Organization", name: SITE.name },
            hasMerchantReturnPolicy: {
              "@type": "MerchantReturnPolicy",
              applicableCountry: "TR",
              returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
              merchantReturnDays: RETURN_WINDOW_DAYS,
              returnMethod: "https://schema.org/ReturnByMail",
            },
          },
        }}
      />
    </PageShell>
  );
}
