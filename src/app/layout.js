import "./globals.css";

export const metadata = {
  title: "Atölye — Mağaza",
  description: "Tarzınızı yansıtan kumaşlar.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
