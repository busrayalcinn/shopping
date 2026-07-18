import Link from "next/link";

// Kullanıcı Stripe ödeme sayfasında "geri dön"e basarsa cancel_url burası olur.
// Sipariş DB'de zaten 'pending' durumda duruyor; ödeme tamamlanmadığı için
// hiçbir şey webhook tarafından güncellenmeyecek — kayıt terk edilmiş sipariş olarak kalır.
export default function OrderCancelPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16 text-center">
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-6">
        <h1 className="text-lg font-medium">Ödeme tamamlanmadı</h1>
        <p className="mt-2 text-sm text-stone-500">
          İşlemi iptal ettin. Sepetin hâlâ duruyor, istediğin zaman tekrar deneyebilirsin.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 hover:bg-stone-700"
        >
          Mağazaya dön
        </Link>
      </div>
    </div>
  );
}
