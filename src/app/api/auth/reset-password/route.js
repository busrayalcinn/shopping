import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  getValidPasswordReset,
  consumePasswordReset,
  updateUserPassword,
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

  const reset = getValidPasswordReset(token);

  if (!reset) {
    return bad(
      "Bu bağlantının süresi dolmuş ya da zaten kullanılmış. Yeniden talep et.",
      410
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  updateUserPassword(reset.userId, passwordHash);

  // Token'ı tek kullanımlık yap
  consumePasswordReset(token);

  return NextResponse.json({ ok: true });
}