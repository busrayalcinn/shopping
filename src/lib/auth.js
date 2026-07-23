import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE = "atolye_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 gün

function secret() {
  const s = process.env.SESSION_SECRET;

  if (!s || s.length < 32) {
    throw new Error(
      "SESSION_SECRET eksik veya çok kısa (.env dosyasına en az 32 karakterlik bir değer koy)."
    );
  }

  return new TextEncoder().encode(s);
}

// Oturum oluştur
export async function createSession(userId) {
  const token = await new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

// Oturumu sil
export function destroySession() {
  cookies().delete(COOKIE);
}

// Geçerli kullanıcıyı getir
export async function getSessionUser() {
  const token = cookies().get(COOKIE)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());

    if (!payload.sub) return null;

    const userId = Number(payload.sub);

    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  } catch {
    return null;
  }
}