"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Minus, Plus, Check, Package, FileText, RotateCcw, Truck } from "lucide-react";
import {
  ORDER_STATUS,
  ORDER_STEPS,
  RETURN_STATUS,
  RETURN_REASONS,
  TONE_CLASSES,
  canUserCancel,
  canRequestReturn,
  returnDeadline,
  fmtTL,
  fmtDate,
} from "@/lib/orderStatus";
import { refundForUnits } from "@/lib/campaign";

export default function OrdersView({ orders }) {
  const [cancelling, setCancelling] = useState(null);
  const [returning, setReturning] = useState(null);

  if (orders.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-stone-300 p-10 text-center">
        <Package className="mx-auto text-stone-400" size={28} />
        <p className="mt-3 text-sm text-stone-600">Henüz bir siparişin yok.</p>
        <Link href="/" className="mt-5 inline-block rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 hover:bg-stone-700">
          Koleksiyonu keşfet
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 space-y-6">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} onCancel={() => setCancelling(o)} onReturn={() => setReturning(o)} />
        ))}
      </div>
      {cancelling && <CancelDialog order={cancelling} onClose={() => setCancelling(null)} />}
      {returning && <ReturnDialog order={returning} onClose={() => setReturning(null)} />}
    </>
  );
}

function Badge({ tone, children }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}>{children}</span>;
}

function OrderCard({ order, onCancel, onReturn }) {
  const [showHistory, setShowHistory] = useState(false);
  const st = ORDER_STATUS[order.status] || { label: order.status, tone: "stone" };
  const deadline = returnDeadline(order);
  const returnable = canRequestReturn(order);

  return (
    <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
        <div>
          <h2 className="font-medium">Sipariş #{order.id}</h2>
          <p className="text-sm text-stone-500">{fmtDate(order.createdAt)}</p>
        </div>
        <div className="text-right">
          <Badge tone={st.tone}>{st.label}</Badge>
          <p className="mt-1 font-semibold">{fmtTL(order.total)}</p>
          {order.discountTotal > 0 && (
            <p className="text-xs text-rose-700">{fmtTL(order.discountTotal)} kampanya indirimi</p>
          )}
          {order.refundedAmount > 0 && (
            <p className="text-xs text-emerald-700">{fmtTL(order.refundedAmount)} iade edildi</p>
          )}
        </div>
      </div>

      {order.status !== "cancelled" && order.status !== "pending" && <Progress status={order.status} />}

      {order.status === "shipped" && order.trackingNumber && (
        <div className="mx-5 mt-4 flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
          <Truck size={16} />
          <span>{order.carrier} · Takip no <span className="font-mono">{order.trackingNumber}</span></span>
        </div>
      )}

      <ul className="mt-4 divide-y divide-stone-100 border-t border-stone-100 px-5">
        {order.items.map((it) => (
          <li key={it.id} className="flex justify-between py-2.5 text-sm">
            <span>
              {it.name} <span className="text-stone-500">· {it.size} × {it.qty}</span>
              {it.discountQty > 0 && <span className="ml-1.5 text-xs text-rose-700">{it.discountQty} adet %20 indirimli</span>}
            </span>
            <span>{fmtTL(it.lineTotal)}</span>
          </li>
        ))}
      </ul>

      {order.returns.length > 0 && (
        <div className="mx-5 mt-2 space-y-2">
          {order.returns.map((r) => {
            const rs = RETURN_STATUS[r.status];
            return (
              <div key={r.id} className="rounded-lg border border-stone-200 px-3 py-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span>İade talebi #{r.id} · {fmtTL(r.refundAmount)}</span>
                  <Badge tone={rs.tone}>{rs.label}</Badge>
                </div>
                {r.status === "approved" && (
                  <p className="mt-1.5 text-xs text-stone-600">
                    Ürünleri etiketleri üzerinde, orijinal ambalajıyla kargoya ver. Ürün bize ulaşınca ödemen kartına iade edilir.
                  </p>
                )}
                {r.status === "rejected" && r.adminNote && <p className="mt-1.5 text-xs text-red-700">{r.adminNote}</p>}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 px-5 py-4">
        {canUserCancel(order) && (
          <button onClick={onCancel} className="rounded-full border border-stone-300 px-4 py-2 text-sm hover:border-stone-900">
            Siparişi iptal et
          </button>
        )}
        {returnable && (
          <button onClick={onReturn} className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-4 py-2 text-sm hover:border-stone-900">
            <RotateCcw size={14} /> İade talebi oluştur
          </button>
        )}
        {order.invoice?.number && order.status !== "pending" && (
          <Link
            href={`/account/orders/${order.id}/invoice`}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-4 py-2 text-sm hover:border-stone-900"
          >
            <FileText size={14} /> Fatura
          </Link>
        )}
        <button onClick={() => setShowHistory((v) => !v)} className="ml-auto text-sm text-stone-500 hover:text-stone-900">
          {showHistory ? "Geçmişi gizle" : "Sipariş geçmişi"}
        </button>
      </div>

      {returnable && deadline && (
        <p className="-mt-2 px-5 pb-4 text-xs text-stone-500">İade için son gün: {fmtDate(deadline)}</p>
      )}
      {order.status === "delivered" && !returnable && (
        <p className="-mt-2 px-5 pb-4 text-xs text-stone-500">14 günlük iade süresi doldu.</p>
      )}

      {showHistory && (
        <ol className="border-t border-stone-100 bg-stone-50 px-5 py-4">
          {order.events.map((e) => (
            <li key={e.id} className="relative border-l border-stone-300 pb-3 pl-4 last:pb-0">
              <span className="absolute -left-[4.5px] top-1.5 h-2 w-2 rounded-full bg-stone-400" />
              <p className="text-sm">{e.message}</p>
              <p className="text-xs text-stone-400">{new Date(e.createdAt).toLocaleString("tr-TR")}</p>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

function Progress({ status }) {
  const current = ORDER_STEPS.indexOf(status);
  return (
    <ol className="mx-5 mt-5 grid grid-cols-4 gap-1" aria-label="Sipariş durumu">
      {ORDER_STEPS.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s}>
            <div className={`h-1 rounded-full ${done ? "bg-stone-900" : "bg-stone-200"}`} />
            <p className={`mt-1.5 text-[11px] ${done ? "text-stone-800" : "text-stone-400"}`}>{ORDER_STATUS[s].label}</p>
          </li>
        );
      })}
    </ol>
  );
}

function Dialog({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-stone-900/40" onClick={onClose} />
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">{title}</h3>
          <button onClick={onClose} aria-label="Kapat" className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const CANCEL_REASONS = ["Yanlış beden / renk seçtim", "Başka bir yerden aldım", "Teslimat çok uzun", "Fikrimi değiştirdim", "Diğer"];

function CancelDialog({ order, onClose }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const paid = order.status !== "pending";

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Sipariş iptal edilemedi."); return; }
      setDone(data);
      router.refresh();
    } catch {
      setError("Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Dialog title="Siparişin iptal edildi" onClose={onClose}>
        <div className="flex gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
          <Check size={18} className="mt-0.5 shrink-0" />
          <p>
            {done.refunded > 0
              ? `${fmtTL(done.refunded)} kartına iade edildi. Bankana bağlı olarak 3–10 iş günü içinde hesabına yansır.`
              : done.refundOk
              ? "Kartından herhangi bir tutar çekilmemişti."
              : "Para iaden otomatik başlatılamadı; ekibimiz en kısa sürede manuel olarak iade edecek."}
          </p>
        </div>
        <button onClick={onClose} className="mt-5 w-full rounded-full bg-stone-900 py-3 text-sm font-medium text-stone-50 hover:bg-stone-700">Tamam</button>
      </Dialog>
    );
  }

  return (
    <Dialog title={`Sipariş #${order.id} iptal edilsin mi?`} onClose={onClose}>
      <p className="text-sm text-stone-600">
        {paid
          ? `Siparişin henüz kargoya verilmedi. İptal edersen ${fmtTL(order.total - order.refundedAmount)} aynı karta iade edilir.`
          : "Bu siparişin ödemesi tamamlanmadı; iptal edersen ayrılan ürünler serbest bırakılır."}
      </p>

      <label className="mt-5 block text-sm text-stone-600" htmlFor="cancel-reason">İptal nedeni (isteğe bağlı)</label>
      <select
        id="cancel-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-900"
      >
        <option value="">Seçmek istemiyorum</option>
        {CANCEL_REASONS.map((r) => <option key={r}>{r}</option>)}
      </select>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
        <button onClick={onClose} className="flex-1 rounded-full border border-stone-300 py-3 text-sm hover:bg-stone-50">Vazgeç</button>
        <button onClick={submit} disabled={busy} className="flex-1 rounded-full bg-red-700 py-3 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50">
          {busy ? "İptal ediliyor…" : "Siparişi iptal et"}
        </button>
      </div>
    </Dialog>
  );
}

function ReturnDialog({ order, onClose }) {
  const router = useRouter();
  const [items, setItems] = useState(null); // [{ orderItemId, name, size, price, returnable }]
  const [qty, setQty] = useState({});
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [doneId, setDoneId] = useState(null);

  // İade edilebilir adetleri sunucudan al (önceki taleplerden düşülmüş hali)
  useEffect(() => {
    let alive = true;
    fetch(`/api/orders/${order.id}/returns`)
      .then((r) => r.json())
      .then((d) => alive && setItems(d.items || []))
      .catch(() => alive && setError("Ürünler yüklenemedi. Sayfayı yenileyip tekrar dene."));
    return () => { alive = false; };
  }, [order.id]);

  const selected = (items || []).filter((it) => (qty[it.orderItemId] || 0) > 0);
  // Ödenen tutar üzerinden (kampanya indirimi düşülmüş) — sunucu da aynı hesabı yapar
  const refund = selected.reduce((s, it) => s + refundForUnits(it, it.used, qty[it.orderItemId]), 0);

  const change = (it, d) =>
    setQty((q) => ({ ...q, [it.orderItemId]: Math.max(0, Math.min(it.returnable, (q[it.orderItemId] || 0) + d)) }));

  const submit = async () => {
    if (selected.length === 0) { setError("İade etmek istediğin ürünleri seç."); return; }
    if (!reason) { setError("Bir iade nedeni seç."); return; }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${order.id}/returns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selected.map((it) => ({ orderItemId: it.orderItemId, qty: qty[it.orderItemId] })),
          reason,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "İade talebi oluşturulamadı."); return; }
      setDoneId(data.id);
      router.refresh();
    } catch {
      setError("Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setBusy(false);
    }
  };

  if (doneId) {
    return (
      <Dialog title="İade talebin alındı" onClose={onClose}>
        <ol className="space-y-3 text-sm text-stone-700">
          <Step n={1} done>Talebin (#{doneId}) bize ulaştı.</Step>
          <Step n={2}>En geç 2 iş günü içinde inceleyip onaylayacağız; durumu bu sayfadan takip edebilirsin.</Step>
          <Step n={3}>Onaydan sonra ürünleri etiketleri üzerinde, orijinal ambalajıyla kargoya ver.</Step>
          <Step n={4}>Ürünler bize ulaşınca {fmtTL(refund)} kartına iade edilir.</Step>
        </ol>
        <button onClick={onClose} className="mt-6 w-full rounded-full bg-stone-900 py-3 text-sm font-medium text-stone-50 hover:bg-stone-700">Tamam</button>
      </Dialog>
    );
  }

  return (
    <Dialog title="İade talebi" onClose={onClose}>
      <p className="text-sm text-stone-600">İade etmek istediğin ürünleri ve adetlerini seç.</p>

      <div className="mt-4 divide-y divide-stone-100 rounded-xl border border-stone-200">
        {items === null && <p className="p-4 text-sm text-stone-400">Yükleniyor…</p>}
        {items?.map((it) => {
          const n = qty[it.orderItemId] || 0;
          return (
            <div key={it.orderItemId} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm">{it.name} <span className="text-stone-500">· {it.size}</span></p>
                <p className="text-xs text-stone-500">
                  {it.returnable > 0
                    ? `${fmtTL(Math.round(it.lineTotal / it.qty))} ödendi · en fazla ${it.returnable} adet`
                    : "Bu ürün için iade talebi zaten var"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button aria-label="Azalt" onClick={() => change(it, -1)} disabled={n === 0} className="rounded border border-stone-300 p-1 disabled:opacity-30"><Minus size={14} /></button>
                <span className="w-5 text-center text-sm">{n}</span>
                <button aria-label="Artır" onClick={() => change(it, 1)} disabled={n >= it.returnable} className="rounded border border-stone-300 p-1 disabled:opacity-30"><Plus size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-sm text-stone-600">Neden iade ediyorsun?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {RETURN_REASONS.map((r) => (
          <button
            key={r}
            onClick={() => { setReason(r); setError(""); }}
            aria-pressed={reason === r}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${reason === r ? "border-stone-900 bg-stone-900 text-stone-50" : "border-stone-300 hover:border-stone-900"}`}
          >
            {r}
          </button>
        ))}
      </div>

      <label className="mt-5 block text-sm text-stone-600" htmlFor="return-note">
        Eklemek istediğin bir not var mı? <span className="text-stone-400">(isteğe bağlı)</span>
      </label>
      <textarea
        id="return-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder={reason === "Kusurlu / hasarlı ürün" ? "Kusuru kısaca anlatır mısın?" : ""}
        className="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-900"
      />

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4 text-sm">
        <span className="text-stone-500">İade edilecek tutar</span>
        <span className="font-semibold">{fmtTL(refund)}</span>
      </div>
      <button onClick={submit} disabled={busy || items === null} className="mt-4 w-full rounded-full bg-stone-900 py-3 text-sm font-medium text-stone-50 hover:bg-stone-700 disabled:opacity-50">
        {busy ? "Gönderiliyor…" : "İade talebini gönder"}
      </button>
    </Dialog>
  );
}

function Step({ n, done, children }) {
  return (
    <li className="flex gap-3">
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${done ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-600"}`}>
        {done ? <Check size={13} /> : n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}
