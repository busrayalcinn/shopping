import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/db";
import { createSession } from "@/lib/auth";

// POST /api/auth/login  Body: { email, password }
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const user = email ? getUserByEmail(email) : null;
  // Kullanıcı yoksa da hash karşılaştırması yapıyoruz ki cevap süresi
  // "bu e-posta kayıtlı mı" bilgisini sızdırmasın (timing açığı).
  const hash = user?.password_hash ?? "$2a$12$C6UzMDM.H6dfI/f/IKcEeO7ZBpQ1sJgqzUKn0F0Yk1s1S9m2mW0PW";
  const valid = await bcrypt.compare(password, hash);

  if (!user || !valid) {
    return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true, user: { email: user.email, name: user.name } });
}
