// Sepet doğrulama: fiyat/renk/beden/adet/stok ve kampanya indirimi SUNUCUDA
// yeniden hesaplanır, istemciden gelen fiyata asla güvenilmez. /api/checkout kullanır.
// Not: buradaki stok kontrolü kullanıcıya erken ve anlaşılır hata vermek içindir;
// kesin kontrol src/lib/orders.js içindeki atomik rezervasyondadır.
import { getProductsByIds } from "@/lib/db";
import { SIZES, MAX_QTY } from "@/lib/constants";
import { priceCart, CAMPAIGN } from "@/lib/campaign";

const MAX_ITEMS = 50;

// items: [{ id, colorId, size, qty }]
// Dönüş: { error, status? } ya da { lines, subtotal, discount, total, campaign }
export async function validateCart(items) {
  if (!Array.isArray(items) || items.length === 0) return { error: "Sepet boş." };
  if (items.length > MAX_ITEMS) return { error: "Sepette çok fazla kalem var." };

  // Aynı ürün + renk + beden birden çok kez geldiyse tek satırda birleştir
  const merged = new Map();
  for (const it of items) {
    const key = `${Number(it.id)}-${Number(it.colorId)}-${it.size}`;
    const qty = Number(it.qty);
    const prev = merged.get(key);
    merged.set(key, { id: Number(it.id), colorId: Number(it.colorId), size: it.size, qty: prev ? prev.qty + qty : qty });
  }

  const ids = [...new Set([...merged.values()].map((i) => i.id))];
  const products = await getProductsByIds(ids);
  const byId = new Map(products.map((p) => [p.id, p]));

  const raw = [];
  for (const [key, it] of merged) {
    const product = byId.get(it.id);
    if (!product || !product.active) return { error: "Sepetindeki bir ürün artık satışta değil. Sepetinden çıkarıp tekrar dene." };

    const color = product.colors.find((c) => c.id === it.colorId);
    if (!color) return { error: `${product.name} için seçtiğin renk artık satışta değil. Sepetinden çıkarıp tekrar dene.` };
    if (!SIZES.includes(it.size)) return { error: `Geçersiz beden: ${it.size}` };

    if (!Number.isInteger(it.qty) || it.qty < 1 || it.qty > MAX_QTY) {
      return { error: `Geçersiz adet (1–${MAX_QTY} arası olmalı).` };
    }

    const label = `${product.name} (${color.name}, ${it.size})`;
    const left = color.stock[it.size] ?? 0;
    if (left < it.qty) {
      return {
        error: left > 0 ? `${label} için stokta yalnızca ${left} adet var.` : `${label} tükendi.`,
        status: 409,
      };
    }

    raw.push({
      key,
      productId: product.id,
      name: product.name,
      price: product.price,
      colorId: color.id,
      colorName: color.name,
      size: it.size,
      qty: it.qty,
      category: product.category,
    });
  }

  const priced = priceCart(raw);
  return {
    // OrderItem sütunlarıyla birebir aynı alanlar
    lines: priced.lines.map((l) => ({
      productId: l.productId,
      name: l.name,
      price: l.price,
      colorId: l.colorId,
      colorName: l.colorName,
      size: l.size,
      qty: l.qty,
      lineTotal: l.lineTotal,
      unitDiscount: l.unitDiscount,
      discountQty: l.discountQty,
    })),
    subtotal: priced.subtotal,
    discount: priced.discount,
    total: priced.total,
    campaign: priced.discount > 0 ? CAMPAIGN.id : null,
  };
}
