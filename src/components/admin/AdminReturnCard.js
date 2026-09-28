"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RETURN_STATUS, TONE_CLASSES, fmtTL } from "@/lib/orderStatus";

export default function AdminReturnCard({ ret }) {
  const router = useRouter();
  const [note, setNote] = useState(ret.adminNote || "");
  const [restock, setRestock] = useState(ret.reason !== "Kusurlu / hasarlı ürün"); // kusurluysa stoğa ekleme
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const act = async (action, confirmText) => {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/returns/${ret.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminNote: note, restock }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "İşlem başarısız."); return; }
      router.refresh();
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  };

  const st = RETURN_STATUS[ret.status];
  const btn = "rounded-full px-4 py-2 text-sm disabled:opacity-50";

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">
            İade #{ret.id} <span className="text-stone-400">· Sipariş #{ret.order.id}</span>
            <span className={`ml-2 inline-flex rounded-full px-2.5 py-0.5 text-xs ${TONE_CLASSES[st.tone]}`}>{st.label}</span>
          </p>
          <p className="text-sm text-stone-500">
            {ret.user.name || ret.user.email} · {new Date(ret.createdAt).toLocaleString("tr-TR")}
          </p>
        </div>
        <p className="text-lg font-semibold">{fmtTL(ret.refundAmount)}</p>
      </div>

      <ul className="mt-3 space-y-1 rounded-lg bg-stone-50 px-4 py-3 text-sm">
        {ret.items.map((ri) => (
          <li key={ri.id} className="flex justify-between">
            <span>{ri.orderItem.name} · {ri.orderItem.colorName ? `${ri.orderItem.colorName} · ` : ""}{ri.orderItem.size} × {ri.qty}</span>
            <span>{fmtTL(ri.amount || ri.orderItem.price * ri.qty)}</span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-sm"><span className="text-stone-500">Neden:</span> {ret.reason}</p>
      {ret.note && <p className="mt-1 text-sm text-stone-600">“{ret.note}”</p>}

      {(ret.status === "requested" || ret.status === "approved") && (
        <>
          <label className="mt-4 block text-xs text-stone-500" htmlFor={`note-${ret.id}`}>
            Müşteriye not {ret.status === "requested" && "(reddederken zorunlu)"}
          </label>
          <input
            id={`note-${ret.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </>
      )}

      {ret.status === "approved" && (
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} />
          Ürünleri tekrar stoğa ekle
        </label>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {ret.status === "requested" && (
          <>
            <button disabled={busy} onClick={() => act("approve")} className={`${btn} bg-stone-900 text-stone-50 hover:bg-stone-700`}>Onayla</button>
            <button disabled={busy} onClick={() => act("reject")} className={`${btn} border border-red-200 text-red-700 hover:bg-red-50`}>Reddet</button>
          </>
        )}
        {ret.status === "approved" && (
          <button
            disabled={busy}
            onClick={() => act("refund", `Ürünler teslim alındı mı? ${fmtTL(ret.refundAmount)} müşterinin kartına iade edilecek.`)}
            className={`${btn} bg-stone-900 text-stone-50 hover:bg-stone-700`}
          >
            Ürünler geldi, {fmtTL(ret.refundAmount)} iade et
          </button>
        )}
        {ret.status === "rejected" && ret.adminNote && <p className="text-sm text-stone-500">Not: {ret.adminNote}</p>}
      </div>
    </div>
  );
}
