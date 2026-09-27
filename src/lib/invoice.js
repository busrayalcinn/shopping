// Fatura hesaplama ve e-Arşiv entegrasyon noktası.
//
// ÖNEMLİ: Türkiye'de internetten satış yapan bir işletme e-Arşiv fatura
// kesmek zorundadır. Bu dosya faturayı veritabanında oluşturur ve müşteriye
// yazdırılabilir bir sayfa sunar; resmi belge için `issueWithProvider`
// fonksiyonunu kullandığın entegratörün (Paraşüt, Logo, Uyumsoft, QNB eFinans…)
// API'sine bağlaman gerekir. KDV oranını mali müşavirinle teyit et.

export const VAT_RATE = Number(process.env.VAT_RATE || 10); // hazır giyim için yaygın oran %10
export const INVOICE_PREFIX = process.env.INVOICE_PREFIX || "ATL"; // 3 karakter

export const SELLER = {
  name: process.env.SELLER_NAME || "Atölye — [Şahıs şirketi unvanı]",
  address: process.env.SELLER_ADDRESS || "[İşletme adresi]",
  taxOffice: process.env.SELLER_TAX_OFFICE || "[Vergi dairesi]",
  taxId: process.env.SELLER_TAX_ID || "[VKN / TCKN]",
  email: process.env.SELLER_EMAIL || "destek@example.com",
};

// Fiyatlar KDV dahil tutulur. Tüm tutarlar kuruş cinsinden döner.
export function splitVat(totalTL, rate = VAT_RATE) {
  const total = Math.round(totalTL * 100);
  const subtotal = Math.round(total / (1 + rate / 100));
  return { total, subtotal, vatAmount: total - subtotal };
}

// GİB formatı: 3 harf önek + yıl + 9 haneli sıra no (toplam 16 karakter)
export function invoiceNumber(id, date = new Date()) {
  return `${INVOICE_PREFIX}${date.getFullYear()}${String(id).padStart(9, "0")}`;
}

// Transaction içinde çağrılır: siparişin faturasını (yoksa) oluşturur.
export async function createInvoiceForOrder(tx, order) {
  const existing = await tx.invoice.findUnique({ where: { orderId: order.id } });
  if (existing) return existing;

  const { total, subtotal, vatAmount } = splitVat(order.total);
  const inv = await tx.invoice.create({
    data: { orderId: order.id, vatRate: VAT_RATE, total, subtotal, vatAmount },
  });
  return tx.invoice.update({
    where: { id: inv.id },
    data: { number: invoiceNumber(inv.id, inv.issuedAt) },
  });
}

// Entegratöre gönderim. Şimdilik yer tutucu: bağlanınca status "issued" ve
// providerRef güncellenmeli; hata olursa "failed" (admin panelinde görünür).
export async function issueWithProvider(/* invoice, order */) {
  return { ok: false, skipped: true };
}
