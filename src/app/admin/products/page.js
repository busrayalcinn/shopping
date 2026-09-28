"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { SIZES } from "@/lib/constants";
import { LOW_STOCK } from "@/lib/orderStatus";

const CATEGORIES = ["Üst Giyim", "Alt Giyim", "Dış Giyim"];

// Sık kullanılan renkler: isim yazılınca renk kodu otomatik dolar
const PRESETS = {
  Beyaz: "#f5f5f4", Siyah: "#1c1917", Bej: "#d6c7b0", Krem: "#efe6d6", Ekru: "#e9e1cf",
  Gri: "#a09d96", Antrasit: "#3f3f46", Lacivert: "#1e2a44", Mavi: "#3b6ea8", "Açık Mavi": "#a9c4e0",
  Haki: "#6b6b3a", Yeşil: "#3f6b4f", Bordo: "#6d1a2a", Kırmızı: "#b91c1c", Pembe: "#e8b4b8",
  Kahverengi: "#6b4a32", Taba: "#a0653a", Vizon: "#a39585", Sarı: "#e8c547", Mor: "#6b4c8a",
};

const emptyStock = () => Object.fromEntries(SIZES.map((s) => [s, 0]));
const newColor = (name = "", hex = "#d6d3d1") => ({ id: null, name, hex, imageUrl: "", active: true, stock: emptyStock() });
const emptyForm = () => ({ name: "", price: "", category: CATEGORIES[0], colors: [newColor()] });

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
            <h1 className="text-3xl font-semibold">Ürünler, renkler ve stok</h1>
          </div>
          <Link href="/admin" className="rounded-full border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100">← Dashboard</Link>
        </div>

        {msg && (
          <p className={`mb-4 rounded-lg px-4 py-2 text-sm ${msg.type === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>
        )}

        <datalist id="color-presets">
          {Object.keys(PRESETS).map((n) => <option key={n} value={n} />)}
        </datalist>

        <form onSubmit={addProduct} className="mb-8 rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Yeni ürün ekle</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <input placeholder="Ürün adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} required />
            <input type="number" min="1" placeholder="Fiyat (₺, KDV dahil)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={input} required />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={input}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <ColorsEditor colors={form.colors} onChange={(colors) => setForm({ ...form, colors })} />
          <button type="submit" className="mt-5 rounded-full bg-stone-900 px-6 py-2.5 text-sm font-medium text-stone-50 hover:bg-stone-700">Ürünü ekle</button>
        </form>

        <label className="mb-3 flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Satıştan kaldırılanları da göster
        </label>

        {loading ? (
          <p className="p-8 text-center text-stone-500">Yükleniyor…</p>
        ) : (
          <div className="space-y-4">
            {visible.map((p) => (
              <div key={p.id} className={`rounded-2xl border bg-white p-5 ${p.active ? "border-stone-200" : "border-dashed border-stone-300 opacity-70"}`}>
                <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
                  <input value={p.name} onChange={(e) => patchLocal(p.id, { name: e.target.value })} className={input} aria-label="Ürün adı" />
                  <input type="number" value={p.price} onChange={(e) => patchLocal(p.id, { price: Number(e.target.value) })} className={input} aria-label="Fiyat" />
                  <select value={p.category} onChange={(e) => patchLocal(p.id, { category: e.target.value })} className={input} aria-label="Kategori">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <ColorsEditor colors={p.colors} onChange={(colors) => patchLocal(p.id, { colors })} />

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

function ColorsEditor({ colors, onChange }) {
  const update = (i, patch) => onChange(colors.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  const onName = (i, name) => {
    const preset = PRESETS[name.trim()];
    update(i, preset ? { name, hex: preset } : { name });
  };

  // Kaydedilmemiş yeni renk listeden tamamen silinir; kayıtlı renk satıştan kaldırılır
  // (geçmiş siparişler ve iadelerde stok iadesi için kaydı korunur).
  const remove = (i) => {
    const c = colors[i];
    if (!c.id) onChange(colors.filter((_, j) => j !== i));
    else update(i, { active: false });
  };

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-stone-600">Renkler ve beden stokları</p>
        <p className="hidden text-xs text-stone-400 sm:block">Fotoğraf yolu, örn. /products/gomlek-siyah.png</p>
      </div>
      <div className="space-y-3">
        {colors.map((c, i) => (
          <div key={c.id ?? `new-${i}`} className={`rounded-xl border p-3 ${c.active ? "border-stone-200" : "border-dashed border-stone-300 bg-stone-50 opacity-60"}`}>
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-14 w-11 shrink-0 overflow-hidden rounded-md border border-stone-200" style={{ background: c.hex }}>
                {c.imageUrl && <img src={c.imageUrl} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />}
              </div>
              <input type="color" value={c.hex} onChange={(e) => update(i, { hex: e.target.value })} className="h-9 w-10 cursor-pointer rounded border border-stone-300" aria-label="Renk kodu" />
              <input list="color-presets" placeholder="Renk adı (örn. Siyah)" value={c.name} onChange={(e) => onName(i, e.target.value)} className={`${input} w-40`} aria-label="Renk adı" />
              <input placeholder="Fotoğraf yolu" value={c.imageUrl || ""} onChange={(e) => update(i, { imageUrl: e.target.value })} className={`${input} min-w-[12rem] flex-1`} aria-label="Fotoğraf yolu" />
              {c.active ? (
                colors.filter((x) => x.active).length > 1 && (
                  <button type="button" onClick={() => remove(i)} className="rounded-full p-2 text-stone-400 hover:bg-red-50 hover:text-red-600" aria-label="Rengi kaldır" title="Rengi kaldır">
                    <Trash2 size={16} />
                  </button>
                )
              ) : (
                <button type="button" onClick={() => update(i, { active: true })} className="inline-flex items-center gap-1 rounded-full border border-stone-300 px-3 py-1.5 text-xs hover:border-stone-900">
                  <RotateCcw size={12} /> Tekrar satışa al
                </button>
              )}
            </div>
            <StockInputs stock={{ ...emptyStock(), ...c.stock }} onChange={(stock) => update(i, { stock })} />
          </div>
        ))}
      </div>
      {colors.length < 12 && (
        <button type="button" onClick={() => onChange([...colors, newColor()])} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-4 py-1.5 text-sm hover:border-stone-900">
          <Plus size={14} /> Renk ekle
        </button>
      )}
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
