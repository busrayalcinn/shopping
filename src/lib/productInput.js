// Admin ürün formundan gelen veriyi doğrular ve kaydeder.
import { SIZES } from "@/lib/constants";

const CATEGORIES = ["Üst Giyim", "Alt Giyim", "Dış Giyim"];
const MAX_COLORS = 12;

function parseColor(c, i) {
  const name = typeof c?.name === "string" ? c.name.trim() : "";
  if (!name) return { error: `${i + 1}. renk için isim zorunlu.` };
  if (name.length > 40) return { error: `"${name}" rengi için isim çok uzun.` };

  const hex = typeof c.hex === "string" ? c.hex.trim().toLowerCase() : "";
  if (!/^#[0-9a-f]{6}$/.test(hex)) return { error: `"${name}" rengi için geçerli bir renk kodu seç (örn. #1c1917).` };

  const stock = {};
  for (const s of SIZES) {
    const n = Number(c.stock?.[s] ?? 0);
    if (!Number.isInteger(n) || n < 0 || n > 100000) return { error: `"${name}" rengi, ${s} bedeni için stok geçersiz.` };
    stock[s] = n;
  }

  return {
    color: {
      id: Number.isInteger(c.id) ? c.id : null,
      name,
      hex,
      imageUrl: typeof c.imageUrl === "string" && c.imageUrl.trim() ? c.imageUrl.trim() : null,
      active: c.active !== false,
      stock,
    },
  };
}

export function parseProductInput(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const price = Number(body.price);
  if (!name) return { error: "Ürün adı zorunlu." };
  if (!Number.isInteger(price) || price <= 0) return { error: "Fiyat pozitif bir tam sayı olmalı." };
  if (!CATEGORIES.includes(body.category)) return { error: "Geçersiz kategori." };

  if (!Array.isArray(body.colors) || body.colors.length === 0) return { error: "En az bir renk ekle." };
  if (body.colors.length > MAX_COLORS) return { error: `En fazla ${MAX_COLORS} renk eklenebilir.` };

  const colors = [];
  const seen = new Set();
  for (let i = 0; i < body.colors.length; i++) {
    const { color, error } = parseColor(body.colors[i], i);
    if (error) return { error };
    const key = color.name.toLocaleLowerCase("tr-TR");
    if (seen.has(key)) return { error: `"${color.name}" rengi iki kez eklenmiş.` };
    seen.add(key);
    colors.push(color);
  }
  if (!colors.some((c) => c.active)) return { error: "En az bir renk satışta olmalı." };

  const cover = colors.find((c) => c.active && c.imageUrl)?.imageUrl || null;

  return {
    data: {
      name,
      price,
      category: body.category,
      swatch: typeof body.swatch === "string" ? body.swatch : "bg-stone-300",
      textColor: typeof body.textColor === "string" ? body.textColor : "text-stone-800",
      imageUrl: cover,
      ...(typeof body.active === "boolean" ? { active: body.active } : {}),
    },
    colors,
  };
}

// Renkleri ve renk/beden stoklarını kaydeder (transaction içinde çağrılır).
// Listede olmayan renklere dokunulmaz; renk kaldırmak için active: false gönderilir.
export async function saveColors(tx, productId, colors) {
  for (let i = 0; i < colors.length; i++) {
    const c = colors[i];
    const data = { name: c.name, hex: c.hex, imageUrl: c.imageUrl, active: c.active, position: i };

    let colorId = c.id;
    if (colorId) {
      const r = await tx.productColor.updateMany({ where: { id: colorId, productId }, data });
      if (r.count === 0) throw Object.assign(new Error("Renk bu ürüne ait değil."), { status: 400 });
    } else {
      colorId = (await tx.productColor.create({ data: { ...data, productId } })).id;
    }

    for (const size of SIZES) {
      await tx.productVariant.upsert({
        where: { colorId_size: { colorId, size } },
        update: { stock: c.stock[size] },
        create: { productId, colorId, size, stock: c.stock[size] },
      });
    }
  }
}

export function productErrorResponse(e) {
  if (e?.code === "P2002") return { error: "Aynı isimde iki renk olamaz.", status: 400 };
  if (e?.status) return { error: e.message, status: e.status };
  return null;
}
