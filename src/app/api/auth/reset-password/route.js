import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  prisma,
  getValidPasswordReset,
} from "@/lib/db";

const bad = (msg, status = 400) =>
  NextResponse.json({ error: msg }, { status });

// POST /api/auth/reset-password
// Body: { token, password }
export async function POST(req) {
  let body;

  try {
    body = await req.json();
  } catch {
    return bad("Geçersiz istek.");
  }

  const token = typeof body.token === "string" ? body.token : "";
  const password =
    typeof body.password === "string" ? body.password : "";

  if (!token) {
    return bad("Sıfırlama bağlantısı geçersiz.");
  }

  if (password.length < 8) {
    return bad("Şifre en az 8 karakter olmalı.");
  }

  const reset = await getValidPasswordReset(token);

  if (!reset) {
    return bad(
      "Bu bağlantının süresi dolmuş ya da zaten kullanılmış. Yeniden talep et.",
      410
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Şifreyi güncelleme ve token'ı tek kullanımlık yapma işlemi birlikte, atomik
  // olarak yapılır (biri başarısız olursa diğeri de geri alınır).
  await prisma.$transaction([
    prisma.user.update({
      where: { id: reset.userId },
      data: { passwordHash },
    }),
    prisma.passwordReset.update({
      where: { token },
      data: { used: true },
    }),
  ]);

  return NextResponse.json({ ok: true });
}