import { NextResponse } from "next/server";
import { getUserByEmail, createUser } from "@/lib/db";
import { createSession } from "@/lib/auth";

const bad = (msg, status = 400) =>
  NextResponse.json({ error: msg }, { status });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
export async function POST(req) {
  let body;

  try {
    body = await req.json();
  } catch {
    return bad("Geçersiz istek.");
  }

  const email =
    typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";

  const password =
    typeof body.password === "string"
      ? body.password
      : "";

  const name =
    (typeof body.name === "string" && body.name.trim()) ||
    email.split("@")[0];

  if (!EMAIL_RE.test(email)) {
    return bad("Geçerli bir e-posta adresi gir.");
  }

  if (password.length < 8) {
    return bad("Şifre en az 8 karakter olmalı.");
  }

  // PRISMA: await gerekli
  const existing = await getUserByEmail(email);

  if (existing) {
    return bad("Bu e-posta ile zaten bir hesap var.", 409);
  }

  // createUser artık password alıyor, hash'i kendi yapıyor
  const user = await createUser({
    email,
    password,
    name,
  });

  await createSession(user.id);

  return NextResponse.json({
    ok: true,
    user: {
      email: user.email,
      name: user.name,
    },
  });
}