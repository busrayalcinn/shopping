// Admin ürün formundan gelen veriyi doğrular.
import { SIZES } from "@/lib/constants";

const CATEGORIES = ["Üst Giyim", "Alt Giyim", "Dış Giyim"];

export function parseProductInput(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const price = Number(body.price);
  if (!name) return { error: "Ürün adı zorunlu." };
  if (!Number.isInteger(price) || price <= 0) return { error: "Fiyat pozitif bir tam sayı olmalı." };
  if (!CATEGORIES.includes(body.category)) return { error: "Geçersiz kategori." };

  const stock = {};
  for (const s of SIZES) {
    const n = Number(body.stock?.[s] ?? 0);
    if (!Number.isInteger(n) || n < 0 || n > 100000) return { error: `${s} bedeni için stok geçersiz.` };
    stock[s] = n;
  }

  return {
    data: {
      name,
      price,
      category: body.category,
      swatch: typeof body.swatch === "string" ? body.swatch : "bg-stone-300",
      textColor: typeof body.textColor === "string" ? body.textColor : "text-stone-800",
      imageUrl: typeof body.imageUrl === "string" && body.imageUrl.trim() ? body.imageUrl.trim() : null,
      ...(typeof body.active === "boolean" ? { active: body.active } : {}),
    },
    stock,
  };
}
