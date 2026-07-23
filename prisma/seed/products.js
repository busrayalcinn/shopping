const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.product.deleteMany();

  await prisma.product.createMany({
    data: [
      {
        name: "Oversize Keten Gömlek",
        price: 540,
        category: "Üst Giyim",
        swatch: "bg-stone-300",
        textColor: "text-stone-800",
      },
      {
        name: "Yüksek Bel Pantolon",
        price: 720,
        category: "Alt Giyim",
        swatch: "bg-stone-800",
        textColor: "text-stone-100",
      },
      {
        name: "Yün Karışımlı Kazak",
        price: 890,
        category: "Üst Giyim",
        swatch: "bg-amber-200",
        textColor: "text-stone-800",
      },
      {
        name: "Pamuklu Basic Tişört",
        price: 260,
        category: "Üst Giyim",
        swatch: "bg-stone-100",
        textColor: "text-stone-800",
      },
      {
        name: "Geniş Paça Jean",
        price: 980,
        category: "Alt Giyim",
        swatch: "bg-indigo-300",
        textColor: "text-stone-900",
      },
      {
        name: "Uzun Trençkot",
        price: 1850,
        category: "Dış Giyim",
        swatch: "bg-stone-400",
        textColor: "text-stone-900",
      },
      {
        name: "Triko Hırka",
        price: 650,
        category: "Üst Giyim",
        swatch: "bg-rose-200",
        textColor: "text-stone-800",
      },
      {
        name: "Pileli Midi Etek",
        price: 580,
        category: "Alt Giyim",
        swatch: "bg-emerald-200",
        textColor: "text-stone-800",
      },
    ],
  });

  console.log("Ürünler PostgreSQL'e eklendi");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());