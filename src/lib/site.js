// Sitenin genel bilgileri. NEXT_PUBLIC_ ile başlayanlar tarayıcıda da okunabilir
// (telefon butonu gibi), bu yüzden buraya gizli bilgi koyma.
export const SITE = {
  name: "Atölye",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  tagline: "Tarzınızı yansıtan kumaşlar.",
  description:
    "Keten gömlek, yün kazak, trençkot ve geniş paça pantolon: Atölye'nin sade ve zamansız kadın giyim koleksiyonu. Kargoya verilene kadar tek tıkla iptal, 14 gün içinde kolay iade.",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "", // örn. "+90 555 123 45 67"
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS || "",
  hours: process.env.NEXT_PUBLIC_CONTACT_HOURS || "Hafta içi 09:00–18:00",
};

// "+90 555 123 45 67" → "tel:+905551234567"
export function telHref(phone = SITE.phone) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function absoluteUrl(path = "/") {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
