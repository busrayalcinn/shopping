import { cache } from "react";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SITE, absoluteUrl, productPath, slugify } from "@/lib/site";
import { JsonLd, returnPolicyLd } from "@/lib/seo";
import PageShell from "@/components/site/PageShell";
import Img from "@/components/site/Img";

export const dynamic = "force-dynamic";

const fmt = (n) => `${n.toLocaleString("tr-TR")} ₺`;

// generateMetadata ve sayfa aynı isteği paylaşır, veritabanına bir kez gidilir.
const getProduct = cache(async (productId) =>
  prisma.product.findFirst({
    where: { id: productId, active: true },
    include: {
      colors: {
        where: { active: true },
        orderBy: [{ position: "asc" }, { id: "asc" }],
        include: { variants: true },
      },
    },
  })
);

// "/product/12" ve "/product/12-oversize-keten-gomlek" ikisi de 12 numaralı ürünü açar
function safeDecode(s = "") {
  try { return decodeURIComponent(s); } catch { return s; }
}

function parseId(param) {
  const m = /^(\d+)(?:-|$)/.exec(safeDecode(param));
  return m ? Number(m[1]) : null;
}

async function load(params) {
  const { id } = await params;
  const productId = parseId(id);
  if (!productId) return null;
  const product = await getProduct(productId);
  if (!product || product.colors.length === 0) return null;
  return { product, param: id };
}

function describe(product) {
  const colors = product.colors.map((c) => c.name).join(", ");
  return `${product.name}, ${fmt(product.price)}. ${product.category} kategorisinde${
    colors ? ` ${colors} renk seçenekleriyle` : ""
  }, XS–XL bedenler. Güvenli ödeme, 14 gün içinde iade — ${SITE.name}.`;
}

export async function generateMetadata({ params }) {
  const data = await load(params);
  if (!data) return { title: "Ürün bulunamadı", robots: { index: false } };
  const { product } = data;
  const path = productPath(product);
  const image = product.colors.find((c) => c.imageUrl)?.imageUrl || product.imageUrl;
  const title = `${product.name} — ${product.category}`;
  return {
    title,
    description: describe(product),
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      title,
      description: describe(product),
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
  };
}

export default async function ProductPage({ params }) {
  const data = await load(params);
  if (!data) notFound();
  const { product, param } = data;

  // Eski ya da eksik adresleri (/product/12) tek bir kalıcı adrese yönlendir
  const path = productPath(product);
  if (`/product/${safeDecode(param)}` !== path) permanentRedirect(path);

  const soldOut = product.colors.every((c) => c.variants.every((v) => v.stock <= 0));
  const cover = product.colors.find((c) => c.imageUrl) || null;
  const gallery = product.colors.filter((c) => c.imageUrl);

  const related = await prisma.product.findMany({
    where: { active: true, category: product.category, id: { not: product.id }, colors: { some: { active: true } } },
    include: { colors: { where: { active: true }, orderBy: [{ position: "asc" }, { id: "asc" }], take: 1 } },
    orderBy: { id: "asc" },
    take: 4,
  });

  const categoryHref = `/?kategori=${slugify(product.category)}`;

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: describe(product),
    sku: String(product.id),
    category: product.category,
    brand: { "@type": "Brand", name: SITE.name },
    ...(gallery.length ? { image: gallery.map((c) => absoluteUrl(c.imageUrl)) } : {}),
    ...(product.colors.length ? { color: product.colors.map((c) => c.name).join(", ") } : {}),
    size: "XS, S, M, L, XL",
    offers: {
      "@type": "Offer",
      url: absoluteUrl(path),
      price: product.price.toFixed(2),
      priceCurrency: "TRY",
      availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE.name },
      hasMerchantReturnPolicy: returnPolicyLd(),
    },
  };

  return (
    <PageShell wide breadcrumbs={[{ name: product.category, href: categoryHref }, { name: product.name }]}>
      <JsonLd data={productLd} />

      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-4">
          {cover ? (
            <Img
              src={cover.imageUrl}
              alt={`${product.name} — ${cover.name}`}
              width={1000}
              height={1250}
              priority
              sizes="(min-width: 1152px) 552px, (min-width: 768px) 50vw, 100vw"
              className="w-full rounded-3xl bg-stone-100 object-cover"
            />
          ) : (
            <div
              role="img"
              aria-label={`${product.name} — fotoğraf yakında`}
              className="aspect-[4/5] w-full rounded-3xl"
              style={{ background: product.colors[0]?.hex || "#d6d3d1" }}
            />
          )}
          {gallery.length > 1 && (
            <div className="grid grid-cols-3 gap-3">
              {gallery.filter((c) => c.id !== cover?.id).map((c) => (
                <Img
                  key={c.id}
                  src={c.imageUrl}
                  alt={`${product.name} — ${c.name}`}
                  width={400}
                  height={500}
                  sizes="(min-width: 768px) 180px, 33vw"
                  className="w-full rounded-2xl bg-stone-100 object-cover"
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone-400">
            <Link href={categoryHref} className="hover:text-stone-700">{product.category}</Link>
          </p>
          <h1 className="mt-2 text-4xl font-semibold">{product.name}</h1>
          <p className="mt-4 text-3xl">{fmt(product.price)}</p>

          <div className="mt-6">
            <p className="text-sm text-stone-500">Renkler</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {product.colors.map((c) => {
                const out = c.variants.every((v) => v.stock <= 0);
                return (
                  <li key={c.id} className={`flex items-center gap-2 rounded-full border border-stone-200 px-3 py-1 text-sm ${out ? "text-stone-400 line-through" : ""}`}>
                    <span className="h-3 w-3 rounded-full border border-stone-300" style={{ background: c.hex }} aria-hidden="true" />
                    {c.name}
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="mt-6 leading-7 text-stone-600">
            Zarif duruşu, seçkin kumaş kalitesi ve özgün tasarımıyla stilinize benzersiz bir imza katacak özel bir koleksiyon parçası.
          </p>

          {soldOut ? (
            <p className="mt-8 inline-block rounded-full bg-stone-200 px-8 py-4 text-stone-600">Tüm bedenler tükendi</p>
          ) : (
            <Link href={`/?product=${product.id}`} className="mt-8 inline-block rounded-full bg-black px-8 py-4 text-white hover:bg-stone-800">
              Beden seç ve sepete ekle
            </Link>
          )}

          <ul className="mt-8 space-y-2 border-t border-stone-200 pt-6 text-sm text-stone-600">
            <li>Kart bilgilerin güvenli ödeme sayfasında alınır.</li>
            <li>Kargoya verilene kadar tek tıkla iptal.</li>
            <li>
              Teslimattan sonra 14 gün içinde iade —{" "}
              <Link href="/iade-ve-degisim" className="underline hover:text-stone-900">iade koşulları</Link>
            </li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="related-title">
          <h2 id="related-title" className="text-xl font-medium">Benzer ürünler</h2>
          <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-4">
            {related.map((r) => {
              const c = r.colors[0];
              const img = c?.imageUrl || r.imageUrl;
              return (
                <Link key={r.id} href={productPath(r)} className="group block">
                  {img ? (
                    <Img
                      src={img}
                      alt={r.name}
                      width={400}
                      height={500}
                      sizes="(min-width: 768px) 25vw, 50vw"
                      className="aspect-[4/5] w-full rounded-xl bg-stone-100 object-cover transition group-hover:opacity-90"
                    />
                  ) : (
                    <div className="aspect-[4/5] w-full rounded-xl" style={{ background: c?.hex || "#d6d3d1" }} />
                  )}
                  <p className="mt-2 text-sm group-hover:underline">{r.name}</p>
                  <p className="text-sm font-medium">{fmt(r.price)}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </PageShell>
  );
}
