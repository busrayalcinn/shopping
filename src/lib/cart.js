// Sepet doğrulama: fiyat/beden/adet SUNUCUDA yeniden hesaplanır, istemciden
// gelen fiyata asla güvenilmez. /api/checkout tarafından kullanılır.
import { getProductsByIds } from "@/lib/db";
import { SIZES, MAX_QTY } from "@/lib/constants";

const MAX_ITEMS = 50;

// items: [{ id, size, qty }]
// Dönüş: { error: string } ya da { lines, total }
export function validateCart(items) {
  if (!Array.isArray(items) || items.length === 0) return { error: "Sepet boş." };
  if (items.length > MAX_ITEMS) return { error: "Sepette çok fazla kalem var." };

  const ids = [...new Set(items.map((i) => Number(i.id)))];
  const byId = new Map(getProductsByIds(ids).map((p) => [p.id, p]));

  let total = 0;
  const lines = [];
  for (const it of items) {
    const product = byId.get(Number(it.id));
    if (!product) return { error: `Ürün bulunamadı: ${it.id}` };
    if (!SIZES.includes(it.size)) return { error: `Geçersiz beden: ${it.size}` };

    const qty = Number(it.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
      return { error: `Geçersiz adet (1–${MAX_QTY} arası olmalı).` };
    }

    const lineTotal = product.price * qty;
    total += lineTotal;
    lines.push({ productId: product.id, name: product.name, price: product.price, size: it.size, qty, lineTotal });
  }

  return { lines, total };
}
