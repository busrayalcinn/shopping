import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/db";
import { createSession } from "@/lib/auth";

const bad = (msg, status = 400) =>
  NextResponse.json({ error: msg }, { status });

// POST /api/auth/login
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

  const user = await verifyUser(email, password);

  if (!user) {
    return bad("E-posta veya şifre hatalı.", 401);
  }

  await createSession(user.id);

  return NextResponse.json({
    ok: true,
    user: {
      email: user.email,
      name: user.name,
    },
  });
}