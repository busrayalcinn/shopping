// URL'ler ve kategori bilgileri. İstemci ve sunucu ortak kullanır (Prisma import etmez).

export const CATEGORIES = [
  {
    name: "Üst Giyim",
    slug: "ust-giyim",
    title: "Kadın Üst Giyim: Keten Gömlek, Kazak ve Tişört",
    description:
      "Keten gömlek, yün karışımlı kazak, triko hırka ve basic tişört modelleri. 14 gün içinde kolay iade.",
  },
  {
    name: "Alt Giyim",
    slug: "alt-giyim",
    title: "Kadın Alt Giyim: Yüksek Bel Pantolon, Jean ve Etek",
    description:
      "Yüksek bel pantolon, geniş paça jean ve pileli midi etek modelleri. 14 gün içinde kolay iade.",
  },
  {
    name: "Dış Giyim",
    slug: "dis-giyim",
    title: "Kadın Dış Giyim: Trençkot ve Ceket",
    description:
      "Uzun trençkot modelleri. Yeni sezon dış giyim parçaları, 14 gün içinde kolay iade.",
  },
];

export const categoryBySlug = (slug) => CATEGORIES.find((c) => c.slug === slug) || null;
export const categoryByName = (name) => CATEGORIES.find((c) => c.name === name) || null;

export function categoryPath(name) {
  const c = categoryByName(name);
  return c ? `/kategori/${c.slug}` : "/";
}

// Türkçe karakterleri sadeleştirip URL'ye uygun hale getirir
export function slugify(text = "") {
  const map = { ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u", Ç: "c", Ğ: "g", Ö: "o", Ş: "s", Ü: "u" };
  return text
    .replace(/[çğıİöşüÇĞÖŞÜ]/g, (ch) => map[ch])
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Ürün adresi: /urun/oversize-keten-gomlek-1  (sondaki sayı ürün numarası)
export function productPath(p) {
  return `/urun/${slugify(p.name)}-${p.id}`;
}

export function productIdFromSlug(slug = "") {
  const m = /-(\d+)$/.exec(slug) || /^(\d+)$/.exec(slug);
  return m ? Number(m[1]) : null;
}

// Metin içindeki fazla boşlukları temizleyip belirli uzunlukta keser (meta açıklama için)
export function clip(text, max = 155) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}
