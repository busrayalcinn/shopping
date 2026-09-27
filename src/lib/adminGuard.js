import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

// Admin API'lerinin ortak yetki kontrolü.
// Kullanım: const { user, deny } = await requireAdmin(); if (deny) return deny;
export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) return { deny: NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 }) };
  if (user.role !== "admin") return { deny: NextResponse.json({ error: "Yetkisiz" }, { status: 403 }) };
  return { user };
}

export function errorResponse(e) {
  if (e?.status && e.message) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error(e);
  return NextResponse.json({ error: "Beklenmeyen bir hata oluştu." }, { status: 500 });
}
