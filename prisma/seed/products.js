const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SIZES = ["XS", "S", "M", "L", "XL"];

// Demo stoklar: bazı bedenler bilerek az/tükenmiş, arayüzdeki uyarıları görmek için.
const products = [
  { name: "Oversize Keten Gömlek", price: 540, category: "Üst Giyim", swatch: "bg-stone-300", textColor: "text-stone-800", imageUrl: "/products/keten-gomlek.png", stock: [4, 8, 12, 6, 2] },
  { name: "Yüksek Bel Pantolon", price: 720, category: "Alt Giyim", swatch: "bg-stone-800", textColor: "text-stone-100", imageUrl: "/products/yuksek-bel-pantolon.png", stock: [0, 5, 9, 7, 3] },
  { name: "Yün Karışımlı Kazak", price: 890, category: "Üst Giyim", swatch: "bg-amber-200", textColor: "text-stone-800", imageUrl: "/products/yun-kazak.png", stock: [3, 6, 6, 4, 1] },
  { name: "Pamuklu Basic Tişört", price: 260, category: "Üst Giyim", swatch: "bg-stone-100", textColor: "text-stone-800", imageUrl: "/products/basic-tisort.png", stock: [15, 20, 20, 18, 10] },
  { name: "Geniş Paça Jean", price: 980, category: "Alt Giyim", swatch: "bg-indigo-300", textColor: "text-stone-900", imageUrl: "/products/genis-paca-jean.png", stock: [2, 4, 5, 4, 0] },
  { name: "Uzun Trençkot", price: 1850, category: "Dış Giyim", swatch: "bg-stone-400", textColor: "text-stone-900", imageUrl: "/products/trenc-kot.png", stock: [1, 3, 3, 2, 1] },
  { name: "Triko Hırka", price: 650, category: "Üst Giyim", swatch: "bg-rose-200", textColor: "text-stone-800", imageUrl: "/products/triko-hirka.png", stock: [5, 7, 7, 5, 3] },
  { name: "Pileli Midi Etek", price: 580, category: "Alt Giyim", swatch: "bg-emerald-200", textColor: "text-stone-800", imageUrl: "/products/pileli-etek.png", stock: [0, 0, 0, 0, 0] },
];

async function main() {
  const count = await prisma.product.count();

  if (count > 0) {
    console.log("Ürünler zaten mevcut, seed atlandı. Stokları admin panelinden girebilirsin.");
    return;
  }

  for (const { stock, ...p } of products) {
    await prisma.product.create({
      data: {
        ...p,
        variants: { create: SIZES.map((size, i) => ({ size, stock: stock[i] })) },
      },
    });
  }

  console.log("Demo ürünler ve stoklar eklendi");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
