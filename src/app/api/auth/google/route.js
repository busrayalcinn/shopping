import { NextResponse } from "next/server";
import crypto from "crypto";

// Her istekte yeni state üretilmeli; statik önbelleğe alınmasın.
export const dynamic = "force-dynamic";

// Google girişini başlatır. `state` değeri çereze yazılır ve callback'te
// karşılaştırılır; böylece başkasının hazırladığı bir bağlantıyla kullanıcının
// yanlış hesaba giriş yaptırılması (login CSRF) engellenir.
export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    state,
  });

  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  res.cookies.set("g_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/api/auth/google",
  });
  return res;
}
