import { MessageCircle } from "lucide-react";
import { SITE } from "@/lib/site";

// Sağ altta sabit WhatsApp butonu
export default function StickyCall() {
  if (!SITE.phone) return null;
  const number = SITE.phone.replace(/\D/g, ""); // "+90 555 123 45 67" → "905551234567"
  const text = encodeURIComponent("Merhaba, bir sorum var.");

  return (
    <a
      href={`https://wa.me/${number}?text=${text}`}
      target="_blank"
      rel="noopener"
      aria-label="WhatsApp'tan yazın"
      className="fixed bottom-5 right-5 z-20 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-medium text-white shadow-lg shadow-black/20 hover:brightness-95"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <MessageCircle size={18} aria-hidden="true" />
    </a>
  );
}