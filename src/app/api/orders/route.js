import { NextResponse } from "next/server";
import { getProductsByIds, createOrder, getOrdersForUser } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { SIZES, MAX_QTY } from "@/lib/constants";

const MAX_ITEMS = 50;
const bad = (msg, status = 400) => NextResponse.json({ error: msg }, { status });

// POST /api/orders  (oturum gerekli)
// Body: { items: [{ id, size, qty }], customer: { name, address } }
// Fiyat, beden ve adet SUNUCUDA doğrulanır; istemciden gelen fiyata güvenilmez.
export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return bad("Sipariş vermek için giriş yapmalısın.", 401);

  let body;
  try { body = await req.json(); } catch { return bad("Geçersiz istek gövdesi (JSON bekleniyor)."); }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) return bad("Sepet boş.");
  if (items.length > MAX_ITEMS) return bad("Sepette çok fazla kalem var.");

  const name = typeof body.customer?.name === "string" ? body.customer.name.trim() : "";
  const address = typeof body.customer?.address === "string" ? body.customer.address.trim() : "";
  if (!name) return bad("Ad Soyad zorunlu.");
  if (!address) return bad("Teslimat adresi zorunlu.");

  const ids = [...new Set(items.map((i) => Number(i.id)))];
  const byId = new Map(getProductsByIds(ids).map((p) => [p.id, p]));

  let total = 0;
  const lines = [];
  for (const it of items) {
    const product = byId.get(Number(it.id));
    if (!product) return bad(`Ürün bulunamadı: ${it.id}`);
    if (!SIZES.includes(it.size)) return bad(`Geçersiz beden: ${it.size}`);

    const qty = Number(it.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
      return bad(`Geçersiz adet (1–${MAX_QTY} arası olmalı).`);
    }

    const lineTotal = product.price * qty;
    total += lineTotal;
    lines.push({ productId: product.id, name: product.name, price: product.price, size: it.size, qty, lineTotal });
  }

  // Sipariş + kalemler tek transaction'da yazılır (bkz. lib/db.js).
  const order = createOrder({ userId: user.id, name, address, total, lines });
  return NextResponse.json({ ok: true, orderId: order.id, total: order.total });
}

// GET /api/orders -> SADECE oturum açan kullanıcının kendi siparişleri
export async function GET() {
  const user = await getSessionUser();
  if (!user) return bad("Giriş yapmalısın.", 401);
  return NextResponse.json(getOrdersForUser(user.id));
}
