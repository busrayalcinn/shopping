import { notFound } from "next/navigation";
import { getProducts } from "@/lib/db";
import Store from "@/components/Store";
import SiteFooter from "@/components/site/SiteFooter";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import { CATEGORIES, categoryBySlug, categoryPath } from "@/lib/seo";

export const revalidate = 60;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const c = categoryBySlug(slug);
  if (!c) return {};
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: categoryPath(c.name) },
    openGraph: { title: c.title, description: c.description, url: categoryPath(c.name) },
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const c = categoryBySlug(slug);
  if (!c) notFound();

  const products = await getProducts();
  return (
    <Store
      products={products}
      initialCat={c.name}
      heading={{ title: c.name, intro: c.description }}
      breadcrumbs={<Breadcrumbs items={[{ name: c.name, href: categoryPath(c.name) }]} />}
      footer={<SiteFooter />}
    />
  );
}
