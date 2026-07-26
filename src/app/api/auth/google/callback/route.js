import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import crypto from "crypto";

export async function GET(req) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}?error=google`
    );
  }

  // access token al
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  const token = await tokenRes.json();

  console.log("TOKEN:");
  console.log(token);

  // kullanıcı bilgisi al
  const userRes = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
      
    }
  );

  const googleUser = await userRes.json();


console.log("GOOGLE USER:");
console.log(googleUser);

    let user = await prisma.user.findUnique({
    where: {
        email: googleUser.email,
    },
    });

    if (!user) {
    user = await prisma.user.create({
        data: {
        email: googleUser.email,
        name: googleUser.name,
        image: googleUser.picture,
        googleId: googleUser.id,
        passwordHash: crypto.randomBytes(32).toString("hex"),
        },
    });
    } else if (!user.googleId) {
    user = await prisma.user.update({
        where: { id: user.id },
        data: {
        googleId: googleUser.id,
        image: googleUser.picture,
        },
    });
    }

  await createSession(user.id);

  return NextResponse.redirect(process.env.NEXTAUTH_URL);
}