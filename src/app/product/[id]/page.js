import { prisma } from "@/lib/db";
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function ProductPage({ params }) {
  const product = await prisma.product.findUnique({
    where: {
      id: Number(params.id),
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto p-10">
      <div className="grid md:grid-cols-2 gap-10">

        <div>
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={1000}
            height={1200}
            className="rounded-3xl w-full object-cover"
          />
        </div>

        <div>
          <h1 className="text-4xl font-semibold">
            {product.name}
          </h1>

          <p className="mt-4 text-3xl">
            {product.price.toLocaleString("tr-TR")} ₺
          </p>

          <p className="mt-6 text-stone-600">
            Premium koleksiyon ürünü.
          </p>

          <button
            className="mt-8 rounded-full bg-black text-white px-8 py-4"
          >
            Sepete Ekle
          </button>
        </div>

      </div>
    </div>
  );
}