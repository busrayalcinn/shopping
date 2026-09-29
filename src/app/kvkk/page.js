import Link from "next/link";
import LegalDoc, { SellerBlock } from "@/components/site/LegalDoc";
import { SELLER } from "@/lib/invoice";

export const metadata = {
  title: "Gizlilik ve KVKK Aydınlatma Metni",
  description: "Atölye'de alışveriş yaparken hangi kişisel verilerinin, hangi amaçla ve hangi hukuki sebeple işlendiği ve KVKK kapsamındaki hakların.",
  alternates: { canonical: "/kvkk" },
};

export default function Kvkk() {
  return (
    <LegalDoc title="Gizlilik ve KVKK Aydınlatma Metni" path="/kvkk">
      <p>
        6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca, veri sorumlusu sıfatıyla kişisel verilerini
        hangi amaçla işlediğimizi ve bu konudaki haklarını aşağıda açıklıyoruz.
      </p>

      <h2>1. Veri sorumlusu</h2>
      <SellerBlock seller={SELLER} />

      <h2>2. İşlenen kişisel veriler</h2>
      <ul>
        <li><strong>Kimlik:</strong> ad soyad; kurumsal faturada firma unvanı; isteğe bağlı olarak T.C. kimlik numarası.</li>
        <li><strong>İletişim:</strong> e-posta adresi, teslimat ve fatura adresi.</li>
        <li><strong>Müşteri işlem:</strong> sipariş, iptal, iade ve fatura kayıtları.</li>
        <li><strong>Finans:</strong> ödeme tutarı ve ödeme işlem numarası. Kart bilgilerin ödeme kuruluşunun güvenli sayfasında alınır; bizim sistemlerimizde saklanmaz.</li>
        <li><strong>İşlem güvenliği:</strong> şifrenin geri döndürülemez biçimde şifrelenmiş hali, oturum bilgisi ve sunucu kayıtları.</li>
        <li><strong>Google ile giriş yaparsan:</strong> Google hesabındaki ad, e-posta adresi ve profil fotoğrafı.</li>
      </ul>

      <h2>3. İşleme amaçları</h2>
      <ul>
        <li>Üyelik hesabının oluşturulması ve güvenliğinin sağlanması,</li>
        <li>Siparişin alınması, ödemenin tahsili, ürünün teslimi ve faturanın düzenlenmesi,</li>
        <li>İptal, iade ve cayma hakkı taleplerinin yürütülmesi,</li>
        <li>Soru ve şikâyetlerinin yanıtlanması,</li>
        <li>Vergi ve tüketici mevzuatından doğan yükümlülüklerin yerine getirilmesi.</li>
      </ul>
      <p>Kişisel verilerin pazarlama amacıyla kullanılmaz ve üçüncü kişilere satılmaz.</p>

      <h2>4. Hukuki sebepler</h2>
      <p>
        Kişisel verilerin KVKK madde 5/2 kapsamında; bir sözleşmenin kurulması veya ifası (c), hukuki yükümlülüğümüzün yerine
        getirilmesi (ç), bir hakkın tesisi, kullanılması veya korunması (e) ve temel hak ve özgürlüklerine zarar vermemek
        kaydıyla meşru menfaatimiz (f) hukuki sebeplerine dayanılarak işlenir.
      </p>

      <h2>5. Kişisel verilerin aktarılması</h2>
      <p>Kişisel verilerin yalnızca yukarıdaki amaçlar için gerekli olduğu ölçüde şu taraflara aktarılabilir:</p>
      <ul>
        <li>Siparişini teslim eden kargo firmaları,</li>
        <li>Ödemeyi gerçekleştiren ödeme kuruluşu,</li>
        <li>e-Arşiv fatura hizmet sağlayıcısı ve mali müşavirimiz,</li>
        <li>Talep hâlinde yetkili kamu kurum ve kuruluşları.</li>
      </ul>
      <p>
        Sitemizin barındırma, veritabanı, e-posta gönderimi ve ödeme altyapısı hizmetlerini aldığımız bazı sağlayıcıların
        sunucuları yurt dışındadır. Bu kapsamdaki aktarımlar KVKK&apos;nın 9. maddesinde öngörülen şartlara uygun olarak yapılır.
        [Aktarımın dayandığı güvenceyi (ör. standart sözleşme) hukukçunla birlikte buraya yaz.]
      </p>

      <h2>6. Toplama yöntemi</h2>
      <p>
        Kişisel verilerin; üyelik, sipariş, iade ve iletişim formları aracılığıyla elektronik ortamda ve sitenin çalışması
        için gerekli çerezler aracılığıyla otomatik yollarla toplanır. Ayrıntılar için{" "}
        <Link href="/cerez-politikasi">Çerez Politikası</Link>&apos;na bakabilirsin.
      </p>

      <h2>7. Saklama süresi</h2>
      <p>
        Kişisel verilerin, işleme amacının gerektirdiği süre ve ilgili mevzuatta öngörülen süreler boyunca (ör. ticari defter
        ve belgeler için 10 yıl) saklanır; sürenin sonunda silinir, yok edilir veya anonim hâle getirilir.
      </p>

      <h2>8. Hakların</h2>
      <p>KVKK&apos;nın 11. maddesi uyarınca;</p>
      <ul>
        <li>Kişisel verilerinin işlenip işlenmediğini öğrenme ve işlenmişse buna ilişkin bilgi talep etme,</li>
        <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
        <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
        <li>Eksik veya yanlış işlenmişse düzeltilmesini, şartları oluşmuşsa silinmesini veya yok edilmesini isteme ve bu işlemlerin aktarıldığı kişilere bildirilmesini talep etme,</li>
        <li>Münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhine bir sonucun ortaya çıkmasına itiraz etme,</li>
        <li>Kanuna aykırı işlenmesi sebebiyle zarara uğraman hâlinde zararın giderilmesini talep etme</li>
      </ul>
      <p>haklarına sahipsin.</p>

      <h2>9. Başvuru</h2>
      <p>
        Taleplerini <a href={`mailto:${SELLER.email}`}>{SELLER.email}</a> adresine kayıtlı e-posta adresinden ya da yukarıdaki
        adrese yazılı olarak iletebilirsin. Başvurun en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.
      </p>
    </LegalDoc>
  );
}
