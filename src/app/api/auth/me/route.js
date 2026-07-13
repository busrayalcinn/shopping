import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

// GET /api/auth/me -> oturum açık kullanıcıyı döner
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { email: user.email, name: user.name } });
}
