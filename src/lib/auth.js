// Oturum yönetimi: imzalı JWT'yi httpOnly çerezde tutar.
// httpOnly => tarayıcıdaki JS okuyamaz (XSS'e karşı),
// imza => içeriği kimse değiştiremez (SESSION_SECRET ile doğrulanır).
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getUserById } from "@/lib/db";

const COOKIE = "atolye_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 gün

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET eksik veya çok kısa (.env dosyasına en az 32 karakterlik bir değer koy).");
  }
  return new TextEncoder().encode(s);
}

export async function createSession(userId) {
  const token = await new SignJWT({ sub: userId })
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

export function destroySession() {
  cookies().delete(COOKIE);
}

// Geçerli oturumun kullanıcısını döner; oturum yoksa/bozuksa null.
export async function getSessionUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return getUserById(payload.sub) ?? null;
  } catch {
    return null; // süresi dolmuş veya geçersiz imza
  }
}
