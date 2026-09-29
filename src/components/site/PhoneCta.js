import { Phone } from "lucide-react";
import { SITE, telHref } from "@/lib/site";

// Ekranın sağ altında sabit duran "Hemen ara" butonu.
// NEXT_PUBLIC_CONTACT_PHONE tanımlı değilse hiç gösterilmez.
export default function PhoneCta() {
  const href = telHref(SITE.phone);
  if (!href) return null;
  return (
    <a
      href={href}
      aria-label={`Bizi arayın: ${SITE.phone}`}
      className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full bg-emerald-600 p-4 text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 print:hidden md:px-5 md:py-3"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <Phone size={20} aria-hidden="true" />
      <span className="hidden text-sm font-medium md:inline">{SITE.phone}</span>
    </a>
  );
}
