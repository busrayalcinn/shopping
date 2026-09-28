const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SIZES = ["XS", "S", "M", "L", "XL"];

// Demo ürünler. Her ürünün ilk rengi orijinal fotoğraftır; diğer renklerin
// fotoğrafları orijinalden yeniden renklendirilmiştir (public/products/*-<renk>.png).
// Fotoğrafı olmayan bir renk eklenirse mağazada rengin kendisi ve "Fotoğraf yakında" gösterilir.
// Stoklar XS, S, M, L, XL sırasıyla; bazıları uyarıları görmek için bilerek az/tükenmiş.
const products = [
  {
    name: "Oversize Keten Gömlek", price: 540, category: "Üst Giyim", swatch: "bg-stone-300", textColor: "text-stone-800",
    colors: [
      { name: "Bej", hex: "#cbb89d", imageUrl: "/products/keten-gomlek.png", stock: [4, 8, 12, 6, 2] },
      { name: "Beyaz", hex: "#f5f5f4", imageUrl: "/products/keten-gomlek-beyaz.png", stock: [3, 5, 6, 4, 2] },
      { name: "Açık Mavi", hex: "#a9c4e0", imageUrl: "/products/keten-gomlek-acik-mavi.png", stock: [0, 2, 3, 2, 0] },
    ],
  },
  {
    name: "Yüksek Bel Pantolon", price: 720, category: "Alt Giyim", swatch: "bg-stone-800", textColor: "text-stone-100",
    colors: [
      { name: "Siyah", hex: "#1c1917", imageUrl: "/products/yuksek-bel-pantolon.png", stock: [0, 5, 9, 7, 3] },
      { name: "Bej", hex: "#d6c7b0", imageUrl: "/products/yuksek-bel-pantolon-bej.png", stock: [2, 4, 4, 3, 1] },
    ],
  },
  {
    name: "Yün Karışımlı Kazak", price: 890, category: "Üst Giyim", swatch: "bg-amber-200", textColor: "text-stone-800",
    colors: [
      { name: "Krem", hex: "#e9dfcf", imageUrl: "/products/yun-kazak.png", stock: [3, 6, 6, 4, 1] },
      { name: "Gri", hex: "#a09d96", imageUrl: "/products/yun-kazak-gri.png", stock: [2, 3, 4, 2, 1] },
      { name: "Kahverengi", hex: "#5e412c", imageUrl: "/products/yun-kazak-kahverengi.png", stock: [1, 2, 2, 1, 0] },
    ],
  },
  {
    name: "Pamuklu Basic Tişört", price: 260, category: "Üst Giyim", swatch: "bg-stone-100", textColor: "text-stone-800",
    colors: [
      { name: "Beyaz", hex: "#f5f5f4", imageUrl: "/products/basic-tisort.png", stock: [15, 20, 20, 18, 10] },
      { name: "Siyah", hex: "#1c1917", imageUrl: "/products/basic-tisort-siyah.png", stock: [10, 15, 15, 12, 8] },
      { name: "Gri", hex: "#a09d96", imageUrl: "/products/basic-tisort-gri.png", stock: [5, 8, 8, 6, 4] },
    ],
  },
  {
    name: "Geniş Paça Jean", price: 980, category: "Alt Giyim", swatch: "bg-indigo-300", textColor: "text-stone-900",
    colors: [
      { name: "Koyu Mavi", hex: "#26364a", imageUrl: "/products/genis-paca-jean.png", stock: [2, 4, 5, 4, 0] },
      { name: "Açık Mavi", hex: "#a9c4e0", imageUrl: "/products/genis-paca-jean-acik-mavi.png", stock: [1, 3, 3, 2, 1] },
    ],
  },
  {
    name: "Uzun Trençkot", price: 1850, category: "Dış Giyim", swatch: "bg-stone-400", textColor: "text-stone-900",
    colors: [
      { name: "Bej", hex: "#b59a76", imageUrl: "/products/trenc-kot.png", stock: [1, 3, 3, 2, 1] },
      { name: "Siyah", hex: "#1c1917", imageUrl: "/products/trenc-kot-siyah.png", stock: [0, 2, 2, 1, 0] },
    ],
  },
  {
    name: "Triko Hırka", price: 650, category: "Üst Giyim", swatch: "bg-rose-200", textColor: "text-stone-800",
    colors: [
      { name: "Krem", hex: "#e9dfcf", imageUrl: "/products/triko-hirka.png", stock: [5, 7, 7, 5, 3] },
      { name: "Bordo", hex: "#6d1a2a", imageUrl: "/products/triko-hirka-bordo.png", stock: [2, 3, 3, 2, 1] },
    ],
  },
  {
    name: "Pileli Midi Etek", price: 580, category: "Alt Giyim", swatch: "bg-emerald-200", textColor: "text-stone-800",
    colors: [{ name: "Kahverengi", hex: "#4a3b28", imageUrl: "/products/pileli-etek.png", stock: [0, 0, 0, 0, 0] }],
  },
];

async function main() {
  const count = await prisma.product.count();

  if (count > 0) {
    console.log("Ürünler zaten mevcut, seed atlandı. Renkleri ve stokları admin panelinden girebilirsin.");
    return;
  }

  for (const { colors, ...p } of products) {
    const product = await prisma.product.create({ data: { ...p, imageUrl: colors[0].imageUrl || null } });
    for (let i = 0; i < colors.length; i++) {
      const { stock, ...c } = colors[i];
      const color = await prisma.productColor.create({
        data: { ...c, imageUrl: c.imageUrl || null, position: i, productId: product.id },
      });
      await prisma.productVariant.createMany({
        data: SIZES.map((size, j) => ({ productId: product.id, colorId: color.id, size, stock: stock[j] })),
      });
    }
  }

  console.log("Demo ürünler, renkler ve stoklar eklendi");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
