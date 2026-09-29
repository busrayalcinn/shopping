// Yönetim paneli arama motorlarında görünmesin
export const metadata = {
  title: { default: "Yönetim Paneli", template: "%s — Yönetim | Atölye" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return children;
}
