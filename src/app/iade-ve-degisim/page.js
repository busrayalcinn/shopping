import Link from "next/link";
import LegalPage, { H2 } from "@/components/site/LegalPage";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "İade ve Değişim Koşulları",
  description: `${SITE.name} iade koşulları: kargoya verilene kadar tek tıkla iptal, teslimattan sonra 14 gün içinde iade ve kartınıza para iadesi.`,
  alternates: { canonical: "/iade-ve-degisim" },
};

export default function ReturnsPage() {
  return (
    <LegalPage title="İade ve Değişim Koşulları" updated="29 Eylül 2026">
      <H2>Sipariş iptali</H2>
      <p>
        Siparişin kargoya verilene kadar <Link href="/account/orders" className="underline">Siparişlerim</Link>{" "}
        sayfasından tek tıkla iptal edebilirsin. Ödediğin tutar aynı karta otomatik olarak iade edilir.
      </p>

      <H2>Cayma hakkı ve iade</H2>
      <p>
        6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, ürünü teslim
        aldığın tarihten itibaren <strong>14 gün</strong> içinde herhangi bir gerekçe göstermeden cayma hakkını
        kullanabilirsin.
      </p>
      <ol className="list-decimal space-y-1 pl-5">
        <li><Link href="/account/orders" className="underline">Siparişlerim</Link> sayfasında ilgili siparişi aç ve &quot;İade talebi&quot; oluştur.</li>
        <li>İade etmek istediğin ürünleri, adetleri ve nedenini seç.</li>
        <li>Talebin onaylandığında ürünleri faturasıyla birlikte, kullanılmamış ve etiketleri sökülmemiş halde kargoya ver.</li>
        <li>Ürünler bize ulaşıp kontrol edildikten sonra ücret, ödemeyi yaptığın karta iade edilir.</li>
      </ol>
      <p>
        Kartına yansıma süresi bankana göre değişebilir. Kampanya indirimi uygulanmış ürünlerde iade tutarı,
        ödediğin indirimli tutar üzerinden hesaplanır.
      </p>

      <H2>İade edilemeyen ürünler</H2>
      <p>
        Hijyen nedeniyle ambalajı açılmış iç giyim ve mayo gibi ürünler ile kullanılmış, yıkanmış veya zarar görmüş
        ürünler iade alınamaz.
      </p>

      <H2>Değişim</H2>
      <p>
        Beden veya renk değişimi için mevcut ürünü iade edip yeni siparişi ayrıca oluşturabilirsin; böylece istediğin
        beden stoktan hemen senin için ayrılır.
      </p>

      <H2>Sorun mu var?</H2>
      <p>
        Hasarlı veya yanlış ürün ulaştıysa lütfen <Link href="/iletisim" className="underline">bizimle iletişime geç</Link>.
      </p>
    </LegalPage>
  );
}
