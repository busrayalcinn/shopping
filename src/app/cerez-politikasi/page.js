import LegalDoc from "@/components/site/LegalDoc";

export const metadata = {
  title: "Çerez Politikası",
  description: "Atölye'de yalnızca sitenin çalışması için zorunlu çerezler kullanılır. Hangi çerezlerin neden kullanıldığını öğren.",
  alternates: { canonical: "/cerez-politikasi" },
};

const ITEMS = [
  ["Oturum çerezi", "Çerez", "Giriş yaptığını hatırlar; httpOnly olarak saklanır, tarayıcıdaki kodlar tarafından okunamaz.", "7 gün"],
  ["Google ile giriş güvenlik çerezi", "Çerez", "Google ile girişte isteğin senden geldiğini doğrular.", "10 dakika"],
  ["Sepet", "Tarayıcı depolaması", "Sayfayı yenilesen de sepetindeki ürünlerin kaybolmamasını sağlar.", "Sen silene kadar"],
  ["Ödeme sekmesi notu", "Tarayıcı depolaması", "Ödeme sayfasından geri dönersen ayrılan stoğu serbest bırakmak için kullanılır.", "Sekme kapanana kadar"],
];

export default function Cerez() {
  return (
    <LegalDoc title="Çerez Politikası" path="/cerez-politikasi">
      <p>
        Çerezler, ziyaret ettiğin sitenin tarayıcına kaydettiği küçük dosyalardır. Sitemizde <strong>yalnızca sitenin çalışması
        için zorunlu</strong> çerezler ve tarayıcı depolaması kullanılır. Reklam, takip veya analiz çerezi kullanılmaz.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-stone-300 text-stone-500">
            <tr><th className="py-2 pr-4 font-normal">Ad</th><th className="py-2 pr-4 font-normal">Tür</th><th className="py-2 pr-4 font-normal">Amaç</th><th className="py-2 font-normal">Süre</th></tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {ITEMS.map(([name, type, purpose, duration]) => (
              <tr key={name}><td className="py-2 pr-4 font-medium">{name}</td><td className="py-2 pr-4">{type}</td><td className="py-2 pr-4">{purpose}</td><td className="py-2">{duration}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Çerezleri nasıl kontrol edebilirim?</h2>
      <p>
        Tarayıcının ayarlarından çerezleri silebilir veya engelleyebilirsin. Zorunlu çerezleri engellersen giriş yapamaz ve
        sipariş veremezsin.
      </p>
    </LegalDoc>
  );
}
