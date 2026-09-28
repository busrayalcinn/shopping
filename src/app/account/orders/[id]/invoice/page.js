import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SELLER } from "@/lib/invoice";
import PrintButton from "@/components/account/PrintButton";

export const dynamic = "force-dynamic";

const kurus = (n) => (n / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";

// Yazdırılabilir fatura görünümü. Tarayıcıdan "PDF olarak kaydet" ile indirilebilir.
// Resmi e-Arşiv belgesi entegratör bağlandığında ayrıca e-postayla gönderilir.
export default async function InvoicePage({ params }) {
  const user = await getSessionUser();
  if (!user) redirect("/?login=1");

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  const order = await prisma.order.findFirst({
    where: { id: orderId, ...(user.role === "admin" ? {} : { userId: user.id }) },
    include: { items: true, invoice: true, user: { select: { email: true } } },
  });
  if (!order?.invoice?.number) notFound();

  const inv = order.invoice;
  const rate = inv.vatRate / 100;

  return (
    <div className="min-h-screen bg-stone-100 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between print:hidden">
        <Link href={user.role === "admin" && order.userId !== user.id ? "/admin/orders" : "/account/orders"} className="text-sm text-stone-500 hover:text-stone-900">
          ← Geri
        </Link>
        <PrintButton />
      </div>

      <article className="mx-auto max-w-3xl bg-white p-8 text-sm text-stone-800 shadow-sm print:shadow-none sm:p-12">
        {inv.status === "cancelled" && (
          <p className="mb-6 rounded bg-red-50 px-3 py-2 text-red-700">Bu fatura, sipariş iptal edildiği için iptal edilmiştir.</p>
        )}
        {order.refundedAmount > 0 && inv.status !== "cancelled" && (
          <p className="mb-6 rounded bg-amber-50 px-3 py-2 text-amber-800">
            Bu siparişte {order.refundedAmount.toLocaleString("tr-TR")} ₺ tutarında iade yapılmıştır.
          </p>
        )}

        <div className="flex flex-wrap justify-between gap-6">
          <div>
            <p className="text-lg font-semibold">{SELLER.name}</p>
            <p className="mt-1 whitespace-pre-line text-stone-600">{SELLER.address}</p>
            <p className="text-stone-600">{SELLER.taxOffice} V.D. · {SELLER.taxId}</p>
            <p className="text-stone-600">{SELLER.email}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-light">e-Arşiv Fatura</p>
            <p className="mt-1 font-mono">{inv.number}</p>
            <p className="text-stone-600">{new Date(inv.issuedAt).toLocaleDateString("tr-TR")}</p>
            <p className="text-stone-600">Sipariş #{order.id}</p>
          </div>
        </div>

        <div className="mt-8 border-t border-stone-200 pt-6">
          <p className="text-stone-500">Sayın</p>
          <p className="font-medium">{order.billingName || order.customerName}</p>
          <p className="whitespace-pre-line text-stone-600">{order.billingAddress || order.address}</p>
          {order.billingType === "corporate" ? (
            <p className="text-stone-600">{order.taxOffice} V.D. · VKN {order.taxId}</p>
          ) : (
            order.taxId && <p className="text-stone-600">TCKN {order.taxId}</p>
          )}
          <p className="text-stone-600">{order.user.email}</p>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="border-b border-stone-300 text-stone-500">
              <tr>
                <th className="py-2 font-normal">Ürün</th>
                <th className="py-2 text-right font-normal">Adet</th>
                <th className="py-2 text-right font-normal">Birim (KDV hariç)</th>
                <th className="py-2 text-right font-normal">İskonto (KDV hariç)</th>
                <th className="py-2 text-right font-normal">KDV %</th>
                <th className="py-2 text-right font-normal">Tutar (KDV dahil)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {order.items.map((it) => (
                <tr key={it.id}>
                  <td className="py-2.5">{it.name} ({it.colorName ? `${it.colorName}, ` : ""}{it.size})</td>
                  <td className="py-2.5 text-right">{it.qty}</td>
                  <td className="py-2.5 text-right">{kurus(Math.round((it.price * 100) / (1 + rate)))}</td>
                  <td className="py-2.5 text-right">
                    {it.price * it.qty > it.lineTotal ? `−${kurus(Math.round(((it.price * it.qty - it.lineTotal) * 100) / (1 + rate)))}` : "—"}
                  </td>
                  <td className="py-2.5 text-right">{inv.vatRate}</td>
                  <td className="py-2.5 text-right">{kurus(it.lineTotal * 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {order.discountTotal > 0 && (
          <p className="mt-4 text-xs text-stone-500">İskonto: Üst giyimde 2. ürüne %20 indirim kampanyası ({order.discountTotal.toLocaleString("tr-TR")} ₺, KDV dahil).</p>
        )}

        <dl className="ml-auto mt-6 w-full max-w-xs space-y-1.5">
          <div className="flex justify-between"><dt className="text-stone-500">Mal hizmet toplamı</dt><dd>{kurus(inv.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-stone-500">Hesaplanan KDV (%{inv.vatRate})</dt><dd>{kurus(inv.vatAmount)}</dd></div>
          <div className="flex justify-between border-t border-stone-300 pt-2 font-semibold"><dt>Ödenecek tutar</dt><dd>{kurus(inv.total)}</dd></div>
        </dl>

        <p className="mt-10 text-xs text-stone-400">
          Ödeme şekli: Kredi / banka kartı · İnternet satışı
          {inv.status !== "issued" && " · Bu belge bilgilendirme amaçlıdır; resmi e-Arşiv faturan ayrıca e-postana gönderilir."}
        </p>
      </article>
    </div>
  );
}
