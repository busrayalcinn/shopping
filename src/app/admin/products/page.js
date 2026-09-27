"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SIZES } from "@/lib/constants";
import { LOW_STOCK } from "@/lib/orderStatus";

const SWATCHES = ["bg-stone-300", "bg-stone-800", "bg-amber-200", "bg-stone-100", "bg-indigo-300", "bg-stone-400", "bg-rose-200", "bg-emerald-200"];
const CATEGORIES = ["Üst Giyim", "Alt Giyim", "Dış Giyim"];
const emptyStock = () => Object.fromEntries(SIZES.map((s) => [s, 0]));
const emptyForm = () => ({ name: "", price: "", category: CATEGORIES[0], swatch: SWATCHES[0], textColor: "text-stone-800", imageUrl: "", stock: emptyStock() });

const input = "rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-900";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState(null); // { type: "ok" | "error", text }
  const [showInactive, setShowInactive] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/products");
    if (res.ok) setProducts(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save(url, method, body, okText) {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg({ type: "error", text: data.error || "İşlem başarısız." }); return false; }
    setMsg({ type: "ok", text: okText });
    await load();
    return true;
  }

  async function addProduct(e) {
    e.preventDefault();
    if (await save("/api/admin/products", "POST", { ...form, price: Number(form.price) }, "Ürün eklendi.")) setForm(emptyForm());
  }

  const patchLocal = (id, patch) => setProducts((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const visible = products.filter((p) => showInactive || p.active);

  return (
    <div className="min-h-screen bg-stone-50 p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-stone-400">Admin / Ürünler</p>
            <h1 className="text-3xl font-semibold">Ürünler ve stok</h1>
          </div>
          <Link href="/admin" className="rounded-full border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100">← Dashboard</Link>
        </div>

        {msg && (
          <p className={`mb-4 rounded-lg px-4 py-2 text-sm ${msg.type === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>
        )}

        <form onSubmit={addProduct} className="mb-8 rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Yeni ürün ekle</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <input placeholder="Ürün adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} required />
            <input type="number" min="1" placeholder="Fiyat (₺, KDV dahil)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={input} required />
            <input placeholder="Fotoğraf yolu, örn. /products/x.png" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className={input} />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={input}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select value={form.swatch} onChange={(e) => setForm({ ...form, swatch: e.target.value })} className={input}>
              {SWATCHES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <p className="mt-4 text-sm text-stone-600">Beden stokları</p>
          <StockInputs stock={form.stock} onChange={(stock) => setForm({ ...form, stock })} />
          <button type="submit" className="mt-4 rounded-full bg-stone-900 px-6 py-2.5 text-sm font-medium text-stone-50 hover:bg-stone-700">Ürünü ekle</button>
        </form>

        <label className="mb-3 flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Satıştan kaldırılanları da göster
        </label>

        {loading ? (
          <p className="p-8 text-center text-stone-500">Yükleniyor…</p>
        ) : (
          <div className="space-y-3">
            {visible.map((p) => (
              <div key={p.id} className={`rounded-2xl border bg-white p-5 ${p.active ? "border-stone-200" : "border-dashed border-stone-300 opacity-70"}`}>
                <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_2fr]">
                  <input value={p.name} onChange={(e) => patchLocal(p.id, { name: e.target.value })} className={input} aria-label="Ürün adı" />
                  <input type="number" value={p.price} onChange={(e) => patchLocal(p.id, { price: Number(e.target.value) })} className={input} aria-label="Fiyat" />
                  <select value={p.category} onChange={(e) => patchLocal(p.id, { category: e.target.value })} className={input} aria-label="Kategori">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <input value={p.imageUrl || ""} onChange={(e) => patchLocal(p.id, { imageUrl: e.target.value })} placeholder="/products/..." className={input} aria-label="Fotoğraf yolu" />
                </div>

                <StockInputs stock={{ ...emptyStock(), ...p.stock }} onChange={(stock) => patchLocal(p.id, { stock })} />

                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => save(`/api/admin/products/${p.id}`, "PUT", p, `“${p.name}” kaydedildi.`)} className="rounded-full bg-stone-900 px-4 py-1.5 text-sm text-white hover:bg-stone-700">
                    Kaydet
                  </button>
                  {p.active ? (
                    <button
                      onClick={() => confirm("Ürün mağazadan kaldırılsın mı? Geçmiş siparişler etkilenmez.") && save(`/api/admin/products/${p.id}`, "DELETE", {}, "Ürün satıştan kaldırıldı.")}
                      className="rounded-full border border-red-200 px-4 py-1.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      Satıştan kaldır
                    </button>
                  ) : (
                    <button onClick={() => save(`/api/admin/products/${p.id}`, "PUT", { ...p, active: true }, "Ürün tekrar satışta.")} className="rounded-full border border-stone-300 px-4 py-1.5 text-sm hover:border-stone-900">
                      Tekrar satışa al
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StockInputs({ stock, onChange }) {
  return (
    <div className="mt-2 grid grid-cols-5 gap-2 sm:max-w-md">
      {SIZES.map((s) => {
        const n = stock[s] ?? 0;
        const tone = n === 0 ? "border-red-300 bg-red-50" : n <= LOW_STOCK ? "border-amber-300 bg-amber-50" : "border-stone-300";
        return (
          <label key={s} className="text-center text-xs text-stone-500">
            {s}
            <input
              type="number"
              min="0"
              value={n}
              onChange={(e) => onChange({ ...stock, [s]: Math.max(0, parseInt(e.target.value || "0", 10)) })}
              className={`mt-1 w-full rounded-lg border px-2 py-1.5 text-center text-sm text-stone-900 outline-none focus:border-stone-900 ${tone}`}
            />
          </label>
        );
      })}
    </div>
  );
}
