import Link from "next/link";
import LegalDoc, { SellerBlock } from "@/components/site/LegalDoc";
import { SELLER } from "@/lib/invoice";
import { RETURN_WINDOW_DAYS } from "@/lib/orderStatus";

export const metadata = {
  title: "Ön Bilgilendirme Formu",
  description: "Mesafeli Sözleşmeler Yönetmeliği kapsamında, sipariş vermeden önce bilmen gereken satıcı, ürün, ödeme, teslimat ve cayma hakkı bilgileri.",
  alternates: { canonical: "/on-bilgilendirme-formu" },
};

export default function OnBilgilendirme() {
  return (
    <LegalDoc title="Ön Bilgilendirme Formu" path="/on-bilgilendirme-formu">
      <p>
        Bu form, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, siparişin
        onaylanmasından önce bilgilendirilmen amacıyla hazırlanmıştır.
      </p>

      <h2>1. Satıcı</h2>
      <SellerBlock seller={SELLER} />

      <h2>2. Ürün ve fiyat</h2>
      <p>
        Satın alınan ürünlerin adı, rengi, bedeni, adedi, birim ve toplam fiyatı (KDV dahil) ile varsa kampanya indirimi, ödeme
        adımından önce sepet ve ödeme ekranında gösterilir ve sipariş onayı e-postası ile faturada yer alır.
      </p>

      <h2>3. Ödeme</h2>
      <p>Ödeme, kredi veya banka kartı ile ödeme kuruluşunun güvenli ödeme sayfası üzerinden peşin olarak alınır.</p>

      <h2>4. Teslimat</h2>
      <p>
        Ürünler, ödemenin onaylanmasından itibaren [1–3 iş günü] içinde kargoya verilir ve siparişte belirtilen teslimat adresine
        teslim edilir. Teslimat süresi her hâlükârda yasal 30 günlük süreyi aşamaz. [Kargo ücretini buraya yaz.]
      </p>

      <h2>5. Cayma hakkı</h2>
      <p>
        Ürünü teslim aldığın tarihten itibaren {RETURN_WINDOW_DAYS} gün içinde hiçbir gerekçe göstermeden ve cezai şart ödemeden
        sözleşmeden cayabilirsin. Cayma hakkının nasıl kullanılacağı <Link href="/iade-ve-degisim">İade ve Değişim</Link>{" "}
        sayfasında açıklanmıştır.
      </p>

      <h2>6. Şikâyet ve itirazlar</h2>
      <p>
        Şikâyetlerini <Link href="/iletisim">iletişim</Link> kanallarımızdan iletebilirsin. Uyuşmazlık hâlinde, Ticaret Bakanlığınca
        her yıl belirlenen parasal sınırlar dâhilinde yerleşim yerindeki Tüketici Hakem Heyetine veya Tüketici Mahkemesine
        başvurabilirsin.
      </p>
    </LegalDoc>
  );
}
