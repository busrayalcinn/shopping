const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const products = [
  {
    name: "Oversize Keten Gömlek",
    price: 540,
    category: "Üst Giyim",
    swatch: "bg-stone-300",
    textColor: "text-stone-800",
    imageUrl: "/products/keten-gomlek.png",
  },
  {
    name: "Yüksek Bel Pantolon",
    price: 720,
    category: "Alt Giyim",
    swatch: "bg-stone-800",
    textColor: "text-stone-100",
    imageUrl: "/products/yuksek-bel-pantolon.png",
  },
  {
    name: "Yün Karışımlı Kazak",
    price: 890,
    category: "Üst Giyim",
    swatch: "bg-amber-200",
    textColor: "text-stone-800",
    imageUrl: "/products/yun-kazak.png",
  },
  {
    name: "Pamuklu Basic Tişört",
    price: 260,
    category: "Üst Giyim",
    swatch: "bg-stone-100",
    textColor: "text-stone-800",
    imageUrl: "/products/basic-tisort.png",
  },
  {
    name: "Geniş Paça Jean",
    price: 980,
    category: "Alt Giyim",
    swatch: "bg-indigo-300",
    textColor: "text-stone-900",
    imageUrl: "/products/genis-paca-jean.png",
  },
  {
    name: "Uzun Trençkot",
    price: 1850,
    category: "Dış Giyim",
    swatch: "bg-stone-400",
    textColor: "text-stone-900",
    imageUrl: "/products/trenc-kot.png",
  },
  {
    name: "Triko Hırka",
    price: 650,
    category: "Üst Giyim",
    swatch: "bg-rose-200",
    textColor: "text-stone-800",
    imageUrl: "/products/triko-hirka.png",
  },
  {
    name: "Pileli Midi Etek",
    price: 580,
    category: "Alt Giyim",
    swatch: "bg-emerald-200",
    textColor: "text-stone-800",
    imageUrl: "/products/pileli-etek.png",
  },
];

async function main() {
  const count = await prisma.product.count();

  if (count > 0) {
    console.log("Ürünler zaten mevcut, seed atlandı.");
    return;
  }

  await prisma.product.createMany({
    data: products,
  });

  console.log("Demo ürünler eklendi");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());