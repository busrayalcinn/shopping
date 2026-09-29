import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { productPath } from "@/lib/seo";

// Eski ürün adresi (/product/5) → yeni adres (/urun/oversize-keten-gomlek-5)
export default async function LegacyProductPage({ params }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();

  const product = await prisma.product.findFirst({ where: { id: productId, active: true }, select: { id: true, name: true } });
  if (!product) notFound();
  permanentRedirect(productPath(product));
}
