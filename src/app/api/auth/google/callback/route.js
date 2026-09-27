import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function GET(req) {
  const base = process.env.NEXTAUTH_URL;
  const fail = () => NextResponse.redirect(`${base}/?error=google`);

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expected = req.cookies.get("g_oauth_state")?.value;
  if (!code || !state || !expected || state !== expected) return fail();

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${base}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return fail();
  const token = await tokenRes.json();

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!userRes.ok) return fail();
  const googleUser = await userRes.json();

  // Doğrulanmamış e-postayla mevcut bir hesaba bağlanmaya izin verme
  if (!googleUser.email || googleUser.verified_email !== true) return fail();
  const email = googleUser.email.toLowerCase();

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: googleUser.name,
        image: googleUser.picture,
        googleId: googleUser.id,
        passwordHash: null, // Google hesabı: şifreyle giriş yok (isterse "şifremi unuttum" ile belirler)
      },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: googleUser.id, image: googleUser.picture },
    });
  }

  await createSession(user.id);

  const res = NextResponse.redirect(base);
  res.cookies.delete({ name: "g_oauth_state", path: "/api/auth/google" });
  return res;
}
