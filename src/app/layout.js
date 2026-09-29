import "./globals.css";
import { SITE } from "@/lib/site";

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Kadın Giyim | Keten Gömlek, Kazak, Trençkot`,
    template: `%s | ${SITE.name}`, // alt sayfalar: "Ürün adı | Atölye"
  },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: SITE.name,
    title: `${SITE.name} — Kadın Giyim`,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false }, // numaraları kendimiz link yapıyoruz
};

export const viewport = {
  themeColor: "#fafaf9",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
