import Link from "next/link";
import LegalDoc, { SellerBlock } from "@/components/site/LegalDoc";
import { SELLER } from "@/lib/invoice";
import { RETURN_WINDOW_DAYS } from "@/lib/orderStatus";

export const metadata = {
  title: "Mesafeli Satış Sözleşmesi",
  description: "Atölye üzerinden verilen siparişlere uygulanan mesafeli satış sözleşmesi: taraflar, ödeme, teslimat, cayma hakkı ve uyuşmazlık çözümü.",
  alternates: { canonical: "/mesafeli-satis-sozlesmesi" },
};

export default function MesafeliSatis() {
  return (
    <LegalDoc title="Mesafeli Satış Sözleşmesi" path="/mesafeli-satis-sozlesmesi">
      <h2>1. Taraflar</h2>
      <p><strong>Satıcı:</strong></p>
      <SellerBlock seller={SELLER} />
      <p>
        <strong>Alıcı:</strong> Sipariş sırasında adı, e-posta adresi, teslimat ve fatura bilgileri alınan kişi.
      </p>

      <h2>2. Konu</h2>
      <p>
        Bu sözleşme, Alıcı&apos;nın internet sitesi üzerinden elektronik ortamda siparişini verdiği ürünlerin satışı ve teslimine
        ilişkin olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca tarafların
        hak ve yükümlülüklerini düzenler.
      </p>

      <h2>3. Ürün, fiyat ve ödeme</h2>
      <p>
        Ürünlerin cinsi, rengi, bedeni, adedi, KDV dahil satış fiyatı ve varsa indirim tutarı sipariş özetinde ve faturada yer
        alır. Ödeme, kart ile peşin olarak alınır. Sözleşme, Alıcı&apos;nın ödeme adımında bu sözleşmeyi ve{" "}
        <Link href="/on-bilgilendirme-formu">Ön Bilgilendirme Formu</Link>&apos;nu onaylayıp ödemeyi tamamlamasıyla kurulur.
      </p>

      <h2>4. Teslimat</h2>
      <p>
        Ürün, ödemenin onaylanmasından itibaren [1–3 iş günü] içinde kargoya verilir; teslimat, yasal 30 günlük süreyi aşmamak
        üzere Alıcı&apos;nın belirttiği adrese yapılır. Kargo takip numarası Siparişlerim sayfasında paylaşılır.
        [Kargo ücretini buraya yaz.]
      </p>

      <h2>5. Sipariş iptali</h2>
      <p>
        Alıcı, sipariş kargoya verilene kadar siparişini Siparişlerim sayfasından iptal edebilir; ödenen tutar aynı karta iade
        edilir. Stok hatası gibi Satıcı kaynaklı nedenlerle sipariş karşılanamazsa Alıcı bilgilendirilir ve ödenen tutar en geç
        14 gün içinde iade edilir.
      </p>

      <h2>6. Cayma hakkı</h2>
      <p>
        Alıcı, ürünü teslim aldığı tarihten itibaren {RETURN_WINDOW_DAYS} gün içinde hiçbir gerekçe göstermeksizin ve cezai şart
        ödemeksizin sözleşmeden cayma hakkına sahiptir. Cayma bildirimi Siparişlerim sayfasındaki iade talebi ile veya{" "}
        <a href={`mailto:${SELLER.email}`}>{SELLER.email}</a> adresine yazılı olarak yapılabilir. Alıcı, ürünü cayma bildiriminden
        itibaren 10 gün içinde geri gönderir. Satıcı, cayma bildiriminin kendisine ulaşmasından itibaren 14 gün içinde ödenen tutarı
        iade eder. Ayrıntılar <Link href="/iade-ve-degisim">İade ve Değişim</Link> sayfasındadır.
      </p>

      <h2>7. Ayıplı ürün</h2>
      <p>
        Ürünün ayıplı çıkması hâlinde Alıcı, 6502 sayılı Kanun&apos;un 11. maddesindeki seçimlik haklarını kullanabilir.
      </p>

      <h2>8. Uyuşmazlık çözümü</h2>
      <p>
        Bu sözleşmeden doğan uyuşmazlıklarda, Ticaret Bakanlığınca her yıl belirlenen parasal sınırlar dâhilinde Alıcı&apos;nın
        yerleşim yerindeki Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.
      </p>

      <h2>9. Yürürlük</h2>
      <p>
        Alıcı, ödeme adımında bu sözleşmeyi onaylayarak tüm koşulları okuduğunu ve kabul ettiğini beyan eder. Sözleşme ve sipariş
        bilgileri Satıcı tarafından saklanır ve talep hâlinde Alıcı&apos;ya iletilir.
      </p>
    </LegalDoc>
  );
}
