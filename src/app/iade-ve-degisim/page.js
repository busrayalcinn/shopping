import Link from "next/link";
import LegalDoc from "@/components/site/LegalDoc";
import { SELLER } from "@/lib/invoice";
import { RETURN_WINDOW_DAYS } from "@/lib/orderStatus";

export const metadata = {
  title: "İade ve Değişim",
  description: `Kargoya verilene kadar tek tıkla iptal, teslimattan sonra ${RETURN_WINDOW_DAYS} gün içinde kolay iade. Atölye iade ve değişim koşulları.`,
  alternates: { canonical: "/iade-ve-degisim" },
};

export default function Iade() {
  return (
    <LegalDoc title="İade ve Değişim" path="/iade-ve-degisim">
      <h2>Sipariş iptali</h2>
      <p>
        Siparişin kargoya verilene kadar <Link href="/account/orders">Siparişlerim</Link> sayfasından tek tıkla iptal edebilirsin.
        Ödediğin tutar aynı karta iade edilir; bankana bağlı olarak 3–10 iş günü içinde hesabına yansır.
      </p>

      <h2>{RETURN_WINDOW_DAYS} gün içinde iade (cayma hakkı)</h2>
      <p>
        Ürünü teslim aldığın günden itibaren {RETURN_WINDOW_DAYS} gün içinde hiçbir gerekçe göstermeden cayma hakkını kullanabilirsin.
      </p>
      <ol className="ml-5 list-decimal space-y-1">
        <li><Link href="/account/orders">Siparişlerim</Link> sayfasından siparişini bul ve &quot;İade talebi oluştur&quot;a tıkla.</li>
        <li>İade etmek istediğin ürünleri, adetlerini ve iade nedenini seç.</li>
        <li>Talebin en geç 2 iş günü içinde onaylanır; durumunu aynı sayfadan takip edebilirsin.</li>
        <li>Ürünleri, cayma bildiriminden itibaren 10 gün içinde, mümkünse orijinal ambalajıyla [anlaşmalı kargo firması ve iade kodu] ile gönder.</li>
        <li>Ödediğin tutar, cayma bildiriminin bize ulaşmasından itibaren en geç 14 gün içinde aynı karta iade edilir.</li>
      </ol>
      <p>[İade kargo ücretinin kime ait olduğunu buraya yaz: ör. &quot;Anlaşmalı kargo ile gönderimlerde iade kargo ücretsizdir.&quot;]</p>
      <p>
        Kampanyalı alışverişlerde iade tutarı, ürün için fiilen ödediğin tutar üzerinden hesaplanır.
      </p>

      <h2>Değişim</h2>
      <p>
        Beden veya renk değişimi için ürünü iade edip istediğin beden ya da rengi yeni bir siparişle alabilirsin. Böylece yeni
        ürün stokta beklemeden sana ulaşır.
      </p>

      <h2>Kusurlu veya yanlış ürün</h2>
      <p>
        Ürün kusurlu ya da siparişinden farklı geldiyse iade talebinde nedeni belirtmen yeterli. 6502 sayılı Tüketicinin Korunması
        Hakkında Kanun kapsamındaki seçimlik hakların (ücretsiz onarım, değişim, bedel iadesi veya indirim) saklıdır; bu durumda
        kargo ücreti bize aittir.
      </p>

      <h2>Soruların için</h2>
      <p>
        <Link href="/iletisim">İletişim</Link> sayfasından ya da <a href={`mailto:${SELLER.email}`}>{SELLER.email}</a> adresinden bize ulaşabilirsin.
      </p>
    </LegalDoc>
  );
}
