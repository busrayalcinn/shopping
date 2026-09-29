import Link from "next/link";
import LegalPage, { H2 } from "@/components/site/LegalPage";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Gizlilik ve Çerez Politikası",
  description: `${SITE.name} internet sitesinde kişisel verilerinizin nasıl korunduğu, hangi çerezlerin neden kullanıldığı ve haklarınız.`,
  alternates: { canonical: "/gizlilik-politikasi" },
};

const COOKIES = [
  ["atolye_session", "Çerez", "Giriş yaptığınızda oturumunuzu açık tutar.", "7 gün"],
  ["g_oauth_state", "Çerez", "Google ile giriş sırasında isteğin size ait olduğunu doğrular.", "10 dakika"],
  ["atolye_cart", "Yerel depolama", "Sepetinizdeki ürünleri sayfa yenilense de saklar.", "Siz silene kadar"],
  ["atolye_pending_checkout", "Oturum depolama", "Ödeme sayfasından geri dönerseniz ayrılan stoğu serbest bırakır.", "Sekme kapanana kadar"],
];

export default function PrivacyPage() {
  return (
    <LegalPage title="Gizlilik ve Çerez Politikası" updated="29 Eylül 2026">
      <p>
        {SITE.name} olarak gizliliğinize önem veriyoruz. Bu politika, sitemizi kullanırken hangi bilgilerin
        toplandığını, nasıl korunduğunu ve hangi çerezlerin kullanıldığını açıklar. Kişisel verilerinizin işlenmesine
        dair ayrıntılar <Link href="/kvkk-aydinlatma-metni" className="underline">KVKK Aydınlatma Metni</Link>&apos;nde yer alır.
      </p>

      <H2>Topladığımız bilgiler</H2>
      <p>
        Yalnızca üyelik, sipariş, teslimat, fatura ve iade süreçleri için gerekli bilgileri (ad soyad, e-posta,
        adres, fatura bilgileri, sipariş geçmişi) topluyoruz. Kart bilgileriniz ödeme kuruluşunun güvenli sayfasında
        girilir; bu bilgiler sitemizden geçmez ve tarafımızca saklanmaz.
      </p>

      <H2>Bilgilerin korunması</H2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Site trafiği HTTPS ile şifrelenir.</li>
        <li>Şifreniz geri döndürülemez biçimde özetlenerek (bcrypt) saklanır; çalışanlarımız dahil kimse göremez.</li>
        <li>Oturum çerezi JavaScript ile okunamaz (httpOnly) ve yalnızca güvenli bağlantı üzerinden gönderilir.</li>
        <li>Bilgileriniz reklam amacıyla üçüncü kişilere satılmaz veya kiralanmaz.</li>
      </ul>

      <H2>Çerezler ve benzeri teknolojiler</H2>
      <p>
        Sitemizde yalnızca hizmetin çalışması için <strong>zorunlu</strong> çerezler ve tarayıcı depolaması
        kullanılır. Reklam, pazarlama veya analiz (ör. ziyaretçi takibi) amaçlı çerez kullanılmaz. Zorunlu çerezler
        için onay gerekmez; ancak tarayıcı ayarlarınızdan bunları silebilir veya engelleyebilirsiniz. Bu durumda
        giriş yapma ve sepet gibi özellikler çalışmayabilir.
      </p>
      <div className="overflow-x-auto">
        <table className="mt-2 w-full min-w-[520px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-stone-300 text-stone-500">
              <th className="py-2 pr-3 font-medium">Ad</th>
              <th className="py-2 pr-3 font-medium">Tür</th>
              <th className="py-2 pr-3 font-medium">Amaç</th>
              <th className="py-2 font-medium">Süre</th>
            </tr>
          </thead>
          <tbody>
            {COOKIES.map(([name, type, purpose, ttl]) => (
              <tr key={name} className="border-b border-stone-200 align-top">
                <td className="py-2 pr-3 font-mono">{name}</td>
                <td className="py-2 pr-3">{type}</td>
                <td className="py-2 pr-3">{purpose}</td>
                <td className="py-2">{ttl}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2>Haklarınız ve iletişim</H2>
      <p>
        KVKK m. 11 kapsamındaki haklarınızı kullanmak veya bu politika hakkında soru sormak için{" "}
        <Link href="/iletisim" className="underline">İletişim</Link> sayfasındaki kanallardan bize ulaşabilirsiniz.
        Bu politika gerektiğinde güncellenir; güncel sürüm her zaman bu sayfada yayımlanır.
      </p>
    </LegalPage>
  );
}
