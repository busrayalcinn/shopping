import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getUserByEmail, createPasswordReset } from "@/lib/db";

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  let body;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const email =
    typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";

  console.log("Şifre sıfırlama isteği:", email);

  const generic = {
    ok: true,
    message:
      "Bu e-posta sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.",
  };

  const user = getUserByEmail(email);

  console.log("Bulunan kullanıcı:", user);

  if (user) {
    const token = createPasswordReset(user.id);

    const origin = new URL(req.url).origin;
    const resetUrl = `${origin}/reset-password?token=${token}`;

    console.log("Reset link:", resetUrl);

    try {
      const result = await resend.emails.send({
        from: "Atolye Store <onboarding@resend.dev>",
        to: email,
        subject: "Şifre Sıfırlama",
        html: `<a href="${resetUrl}">Şifreyi sıfırla</a>`,
      });

      console.log("Resend sonucu:", result);
      console.log(`Mail gönderildi: ${email}`);
    } catch (err) {
      console.error("Mail gönderilemedi:", err);
    }
  } else {
    console.log("Kullanıcı bulunamadı");
  }

  return NextResponse.json(generic);
}
