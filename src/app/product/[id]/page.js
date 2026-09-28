import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();

  const product = await prisma.product.findFirst({
    where: { id: productId, active: true },
    include: { colors: { where: { active: true }, include: { variants: true } } },
  });
  if (!product) notFound();

  const soldOut = product.colors.every((c) => c.variants.every((v) => v.stock <= 0));

  return (
    <div className="mx-auto max-w-6xl p-6 sm:p-10">
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} width={1000} height={1200} className="w-full rounded-3xl object-cover" />
          ) : (
            <div className={`aspect-[3/4] w-full rounded-3xl ${product.swatch}`} />
          )}
        </div>

        <div>
          <h1 className="text-4xl font-semibold">{product.name}</h1>
          <p className="mt-4 text-3xl">{product.price.toLocaleString("tr-TR")} ₺</p>
          <p className="mt-6 text-stone-600">Premium koleksiyon ürünü.</p>

          {soldOut ? (
            <p className="mt-8 inline-block rounded-full bg-stone-200 px-8 py-4 text-stone-600">Tüm bedenler tükendi</p>
          ) : (
            <Link href={`/?product=${product.id}`} className="mt-8 inline-block rounded-full bg-black px-8 py-4 text-white">
              Beden seç ve sepete ekle
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
