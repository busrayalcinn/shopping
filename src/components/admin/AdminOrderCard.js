"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CARRIERS, ORDER_STATUS, TONE_CLASSES, fmtTL } from "@/lib/orderStatus";

export default function AdminOrderCard({ order, statusLabel }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shipOpen, setShipOpen] = useState(false);
  const [carrier, setCarrier] = useState(CARRIERS[0]);
  const [tracking, setTracking] = useState("");

  const act = async (action, extra = {}, confirmText) => {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "İşlem başarısız."); return; }
      if (data.refundOk === false) setError("Sipariş iptal edildi ama para iadesi başarısız oldu. \"İadeyi tekrar dene\"yi kullan.");
      setShipOpen(false);
      router.refresh();
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  };

  const tone = ORDER_STATUS[order.status]?.tone || "stone";
  const btn = "rounded-full px-4 py-2 text-sm disabled:opacity-50";

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-medium">
            Sipariş #{order.id}
            <span className={`ml-2 inline-flex rounded-full px-2.5 py-0.5 text-xs ${TONE_CLASSES[tone]}`}>{statusLabel}</span>
          </p>
          <p className="text-sm text-stone-500">{new Date(order.createdAt).toLocaleString("tr-TR")}</p>
          <p className="mt-1 text-sm">{order.customerName} · {order.user?.email}</p>
          <p className="max-w-md text-xs text-stone-500">{order.address}</p>
          {order.billingType === "corporate" && (
            <p className="mt-1 text-xs text-stone-500">Kurumsal fatura: {order.billingName} · {order.taxOffice} V.D. · {order.taxId}</p>
          )}
          {order.trackingNumber && <p className="mt-1 text-xs text-stone-500">{order.carrier} · {order.trackingNumber}</p>}
          {order.cancelReason && <p className="mt-1 text-xs text-stone-500">İptal nedeni: {order.cancelReason}</p>}
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">{fmtTL(order.total)}</p>
          {order.refundedAmount > 0 && <p className="text-xs text-emerald-700">{fmtTL(order.refundedAmount)} iade edildi</p>}
          {order.invoice?.number && (
            <Link href={`/account/orders/${order.id}/invoice`} className="text-xs text-stone-500 underline hover:text-stone-900">
              Fatura {order.invoice.number}
            </Link>
          )}
        </div>
      </div>

      <ul className="mt-3 space-y-1 rounded-lg bg-stone-50 px-4 py-3 text-sm text-stone-700">
        {order.items.map((it) => (
          <li key={it.id} className="flex justify-between">
            <span>{it.name} · {it.size} × {it.qty}</span>
            <span>{fmtTL(it.lineTotal)}</span>
          </li>
        ))}
      </ul>

      {order.refundFailed && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Bu siparişin para iadesi otomatik yapılamadı ({fmtTL(order.total - order.refundedAmount)} bekliyor).
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {order.status === "paid" && (
          <button disabled={busy} onClick={() => act("prepare")} className={`${btn} bg-stone-900 text-stone-50 hover:bg-stone-700`}>
            Hazırlamaya başla
          </button>
        )}
        {["paid", "preparing"].includes(order.status) && !shipOpen && (
          <button disabled={busy} onClick={() => setShipOpen(true)} className={`${btn} ${order.status === "preparing" ? "bg-stone-900 text-stone-50 hover:bg-stone-700" : "border border-stone-300 hover:border-stone-900"}`}>
            Kargoya ver
          </button>
        )}
        {order.status === "shipped" && (
          <button disabled={busy} onClick={() => act("deliver")} className={`${btn} bg-stone-900 text-stone-50 hover:bg-stone-700`}>
            Teslim edildi olarak işaretle
          </button>
        )}
        {["pending", "paid", "preparing", "shipped"].includes(order.status) && (
          <button
            disabled={busy}
            onClick={() => {
              const reason = prompt("İptal nedeni (müşteri görecek):", "Stok hatası nedeniyle");
              if (reason !== null) act("cancel", { reason });
            }}
            className={`${btn} border border-red-200 text-red-700 hover:bg-red-50`}
          >
            İptal et ve parayı iade et
          </button>
        )}
        {order.refundFailed && (
          <button disabled={busy} onClick={() => act("retry-refund")} className={`${btn} border border-stone-300 hover:border-stone-900`}>
            İadeyi tekrar dene
          </button>
        )}
      </div>

      {shipOpen && (
        <div className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-stone-200 p-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-stone-500">Kargo firması</span>
            <select value={carrier} onChange={(e) => setCarrier(e.target.value)} className="rounded-lg border border-stone-300 px-3 py-2">
              {CARRIERS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="flex-1 text-sm">
            <span className="mb-1 block text-xs text-stone-500">Takip numarası</span>
            <input value={tracking} onChange={(e) => setTracking(e.target.value)} className="w-full rounded-lg border border-stone-300 px-3 py-2" />
          </label>
          <button disabled={busy || !tracking.trim()} onClick={() => act("ship", { carrier, trackingNumber: tracking })} className={`${btn} bg-stone-900 text-stone-50 hover:bg-stone-700`}>
            Kaydet
          </button>
          <button onClick={() => setShipOpen(false)} className={`${btn} text-stone-500`}>Vazgeç</button>
        </div>
      )}
    </div>
  );
}
