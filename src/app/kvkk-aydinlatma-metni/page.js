import Link from "next/link";
import LegalPage, { H2, SellerInfo } from "@/components/site/LegalPage";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "KVKK Aydınlatma Metni",
  description: `${SITE.name} olarak müşterilerimizin kişisel verilerini 6698 sayılı KVKK kapsamında hangi amaçlarla ve nasıl işlediğimize dair aydınlatma metni.`,
  alternates: { canonical: "/kvkk-aydinlatma-metni" },
};

export default function KvkkPage() {
  return (
    <LegalPage title="KVKK Aydınlatma Metni" updated="29 Eylül 2026">
      <p>
        Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) ve Aydınlatma Yükümlülüğünün
        Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ uyarınca, veri sorumlusu sıfatıyla
        müşterilerimizi bilgilendirmek amacıyla hazırlanmıştır.
      </p>

      <H2>1. Veri sorumlusu</H2>
      <SellerInfo />

      <H2>2. İşlenen kişisel veriler</H2>
      <ul className="list-disc space-y-1 pl-5">
        <li><strong>Kimlik:</strong> ad soyad; bireysel fatura için isteğe bağlı T.C. kimlik numarası.</li>
        <li><strong>İletişim:</strong> e-posta adresi, teslimat ve fatura adresi.</li>
        <li><strong>Müşteri işlem:</strong> sipariş, iptal ve iade kayıtları, iade nedeni, fatura bilgileri; kurumsal faturada firma unvanı, vergi numarası ve vergi dairesi.</li>
        <li><strong>İşlem güvenliği:</strong> şifrenin geri döndürülemez özeti (şifrenin kendisi saklanmaz), oturum çerezi, IP adresi ve erişim kayıtları.</li>
        <li><strong>Google ile giriş yapılırsa:</strong> Google hesap kimliği, adı, e-posta adresi ve profil fotoğrafı.</li>
        <li>
          <strong>Finans:</strong> ödeme ve iade tutarları. Kart bilgileri ödeme kuruluşunun güvenli sayfasında
          alınır; tarafımızca görülmez ve saklanmaz.
        </li>
      </ul>

      <H2>3. İşleme amaçları ve hukuki sebepler</H2>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          Üyelik hesabının oluşturulması, siparişin alınması, ödemenin tahsili, teslimat, iptal ve iade süreçlerinin
          yürütülmesi — <em>bir sözleşmenin kurulması veya ifası</em> (KVKK m. 5/2-c).
        </li>
        <li>
          Fatura düzenlenmesi, muhasebe kayıtlarının tutulması, tüketici mevzuatından doğan yükümlülükler ve
          yetkili kurumların taleplerinin karşılanması — <em>hukuki yükümlülüğün yerine getirilmesi</em> (m. 5/2-ç).
        </li>
        <li>
          Hesap ve ödeme güvenliğinin sağlanması, dolandırıcılığın önlenmesi, müşteri taleplerinin yanıtlanması —
          <em> veri sorumlusunun meşru menfaati</em> (m. 5/2-f).
        </li>
        <li>Olası uyuşmazlıklarda hakların korunması — <em>bir hakkın tesisi, kullanılması veya korunması</em> (m. 5/2-e).</li>
      </ul>

      <H2>4. Toplama yöntemi</H2>
      <p>
        Kişisel verileriniz; internet sitemizdeki üyelik, giriş, sipariş, iade ve iletişim formları ile Google ile
        giriş seçeneği üzerinden elektronik ortamda, otomatik yollarla toplanır.
      </p>

      <H2>5. Aktarılan taraflar</H2>
      <p>Kişisel verileriniz yukarıdaki amaçlarla ve yalnızca gerekli olduğu ölçüde şu taraflarla paylaşılır:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>Siparişin teslimi için kargo şirketleri,</li>
        <li>Ödeme ve iadelerin gerçekleştirilmesi için ödeme kuruluşu,</li>
        <li>e-Arşiv faturanın düzenlenmesi için özel entegratör ve muhasebe hizmeti sağlayıcıları,</li>
        <li>Barındırma, veritabanı ve e-posta gönderimi hizmeti aldığımız bilişim altyapı sağlayıcıları,</li>
        <li>Talep halinde yetkili kamu kurum ve kuruluşları ile yargı mercileri.</li>
      </ul>
      <p>
        Kullandığımız bazı altyapı hizmetlerinin (ödeme, barındırma, e-posta, Google ile giriş) sunucuları yurt
        dışında bulunabilir. Bu aktarımlar KVKK m. 9 kapsamındaki güvencelere uygun olarak yapılır.
      </p>

      <H2>6. Saklama süresi</H2>
      <p>
        Fatura ve muhasebe kayıtları ilgili vergi ve ticaret mevzuatının öngördüğü süre (10 yıl) boyunca, diğer
        veriler işleme amacının gerektirdiği süre boyunca saklanır; süre sonunda silinir, yok edilir veya anonim
        hale getirilir.
      </p>

      <H2>7. KVKK m. 11 kapsamındaki haklarınız</H2>
      <p>Veri sahibi olarak;</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme,</li>
        <li>işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
        <li>yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
        <li>eksik veya yanlış işlenmişse düzeltilmesini, şartları oluştuğunda silinmesini veya yok edilmesini isteme ve bu işlemlerin aktarıldığı üçüncü kişilere bildirilmesini talep etme,</li>
        <li>münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme,</li>
        <li>kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
      </ul>
      <p>haklarına sahipsiniz.</p>

      <H2>8. Başvuru</H2>
      <p>
        Haklarınıza ilişkin taleplerinizi, kimliğinizi doğrulayan bilgilerle birlikte
        {SITE.email ? <> <a href={`mailto:${SITE.email}`} className="underline">{SITE.email}</a> adresine e-posta ile</> : " e-posta ile"}{" "}
        veya yukarıdaki adresimize yazılı olarak iletebilirsiniz. Başvurunuz en geç 30 gün içinde ücretsiz olarak
        sonuçlandırılır.
      </p>
      <p>
        Çerezler hakkında bilgi için{" "}
        <Link href="/gizlilik-politikasi" className="underline">Gizlilik ve Çerez Politikası</Link>&apos;na bakabilirsiniz.
      </p>
    </LegalPage>
  );
}
