// Site genelinde kullanılan marka ve iletişim bilgileri.
// Canlıda Vercel → Settings → Environment Variables üzerinden doldurulur.
// NEXT_PUBLIC_ ile başlayanlar tarayıcıya da gider (telefon butonu için gerekli).

function clean(v) {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function siteUrl() {
  const raw =
    clean(process.env.NEXT_PUBLIC_SITE_URL) ||
    clean(process.env.NEXTAUTH_URL) ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export const SITE = {
  name: "Atölye",
  url: siteUrl(),
  tagline: "Tarzınızı yansıtan kumaşlar.",
  description:
    "Keten gömlek, triko, yüksek bel pantolon, jean ve trençkot. Renk ve beden seçenekleriyle Atölye yeni sezon giyim koleksiyonu; güvenli ödeme ve 14 gün içinde iade.",
  // Ekranda gösterilen hali, örn. "0850 123 45 67"
  phone: clean(process.env.NEXT_PUBLIC_CONTACT_PHONE),
  email: clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL) || clean(process.env.SELLER_EMAIL),
  address: clean(process.env.NEXT_PUBLIC_CONTACT_ADDRESS) || clean(process.env.SELLER_ADDRESS),
  hours: clean(process.env.NEXT_PUBLIC_CONTACT_HOURS) || "Hafta içi 09:00 – 18:00",
  // Yasal metinlerde geçen satıcı bilgileri (yalnızca sunucuda okunur)
  legalName: clean(process.env.SELLER_NAME),
  taxOffice: clean(process.env.SELLER_TAX_OFFICE),
  taxId: clean(process.env.SELLER_TAX_ID),
};

// tel: bağlantısı için: "0850 123 45 67" → "+908501234567"
export function telHref(phone) {
  if (!phone) return null;
  let d = phone.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return `tel:${d}`;
  if (d.startsWith("00")) return `tel:+${d.slice(2)}`;
  if (d.startsWith("0")) d = d.slice(1);
  return `tel:+90${d}`;
}

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

const TR_MAP = { ç: "c", ğ: "g", ı: "i", i: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };

export function slugify(text = "") {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıiöşüâîû]/g, (ch) => TR_MAP[ch] || ch)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Ürün sayfasının kalıcı adresi: /product/12-oversize-keten-gomlek
export function productPath(p) {
  const slug = slugify(p.name);
  return `/product/${p.id}${slug ? `-${slug}` : ""}`;
}

export const LEGAL_LINKS = [
  { href: "/iletisim", label: "İletişim" },
  { href: "/iade-ve-degisim", label: "İade ve Değişim" },
  { href: "/gizlilik-politikasi", label: "Gizlilik ve Çerez Politikası" },
  { href: "/kvkk-aydinlatma-metni", label: "KVKK Aydınlatma Metni" },
];
