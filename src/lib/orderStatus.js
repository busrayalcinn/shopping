// Sipariş / iade durumları ve kuralları. Hem sunucu hem istemci kullanır
// (Prisma import ETMEZ), bu yüzden arayüzde de güvenle kullanılabilir.

export const ORDER_STATUS = {
  pending:   { label: "Ödeme bekleniyor", tone: "amber" },
  expired:   { label: "Ödeme yapılmadı",  tone: "stone" },
  paid:      { label: "Sipariş alındı",   tone: "sky" },
  preparing: { label: "Hazırlanıyor",     tone: "sky" },
  shipped:   { label: "Kargoda",          tone: "indigo" },
  delivered: { label: "Teslim edildi",    tone: "emerald" },
  cancelled: { label: "İptal edildi",     tone: "red" },
};

// Müşteriye gösterilen ilerleme çubuğunun adımları
export const ORDER_STEPS = ["paid", "preparing", "shipped", "delivered"];

// Kargoya verilmeden önce müşteri tek tıkla iptal edebilir.
export const USER_CANCELLABLE = ["pending", "paid", "preparing"];
export const ADMIN_CANCELLABLE = ["pending", "paid", "preparing", "shipped"];

// Mesafeli Sözleşmeler Yönetmeliği: 14 günlük cayma hakkı (teslimden itibaren).
export const RETURN_WINDOW_DAYS = 14;

export const RETURN_REASONS = [
  "Beden uymadı",
  "Beklediğim gibi değil",
  "Kusurlu / hasarlı ürün",
  "Yanlış ürün gönderildi",
  "Fikrimi değiştirdim",
  "Diğer",
];

export const RETURN_STATUS = {
  requested: { label: "İnceleniyor",               tone: "amber" },
  approved:  { label: "Onaylandı · ürünü gönder",  tone: "sky" },
  rejected:  { label: "Reddedildi",                tone: "red" },
  refunded:  { label: "Para iadesi yapıldı",       tone: "emerald" },
};

// Aktif (reddedilmemiş) iade talepleri ürün adedinden düşülür
export const ACTIVE_RETURN_STATUSES = ["requested", "approved", "refunded"];

export const CARRIERS = ["Yurtiçi Kargo", "Aras Kargo", "MNG Kargo", "PTT Kargo", "Sürat Kargo", "HepsiJET"];

export const LOW_STOCK = 3;

export function canUserCancel(order) {
  return USER_CANCELLABLE.includes(order.status);
}

export function returnDeadline(order) {
  if (!order.deliveredAt) return null;
  const d = new Date(order.deliveredAt);
  d.setDate(d.getDate() + RETURN_WINDOW_DAYS);
  return d;
}

export function canRequestReturn(order, now = new Date()) {
  if (order.status !== "delivered") return false;
  const deadline = returnDeadline(order);
  return !!deadline && now <= deadline;
}

export const TONE_CLASSES = {
  amber:   "bg-amber-100 text-amber-800",
  stone:   "bg-stone-200 text-stone-700",
  sky:     "bg-sky-100 text-sky-800",
  indigo:  "bg-indigo-100 text-indigo-800",
  emerald: "bg-emerald-100 text-emerald-800",
  red:     "bg-red-100 text-red-700",
};

export const fmtTL = (n) => `${Number(n).toLocaleString("tr-TR")} ₺`;
export const fmtDate = (d) =>
  new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
