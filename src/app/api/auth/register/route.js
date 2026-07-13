import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail, createUser } from "@/lib/db";
import { createSession } from "@/lib/auth";

const bad = (msg, status = 400) => NextResponse.json({ error: msg }, { status });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register  Body: { email, password, name? }
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return bad("Geçersiz istek."); }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = (typeof body.name === "string" && body.name.trim()) || email.split("@")[0];

  if (!EMAIL_RE.test(email)) return bad("Geçerli bir e-posta adresi gir.");
  if (password.length < 8) return bad("Şifre en az 8 karakter olmalı.");

  if (getUserByEmail(email)) return bad("Bu e-posta ile zaten bir hesap var.", 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = createUser({ email, passwordHash, name });

  await createSession(user.id);
  return NextResponse.json({ ok: true, user: { email: user.email, name: user.name } });
}
