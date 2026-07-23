"use client";

import { useEffect, useState } from "react";

const SWATCHES = [
  "bg-stone-300",
  "bg-stone-800",
  "bg-amber-200",
  "bg-stone-100",
  "bg-indigo-300",
  "bg-stone-400",
  "bg-rose-200",
  "bg-emerald-200",
];

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "Üst Giyim",
    swatch: "bg-stone-300",
    textColor: "text-stone-800",
    imageUrl: "",
  });

  async function loadProducts() {
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function addProduct(e) {
    e.preventDefault();

    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      alert("Ürün eklenemedi");
      return;
    }

    setForm({
      name: "",
      price: "",
      category: "Üst Giyim",
      swatch: "bg-stone-300",
      textColor: "text-stone-800",
      imageUrl: "", 
    });

    loadProducts();
  }

  async function deleteProduct(id) {
    if (!confirm("Bu ürünü silmek istiyor musun?")) return;

    await fetch(`/api/admin/products/${id}`, {
      method: "DELETE",
    });

    loadProducts();
  }

  async function updateProduct(product) {
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });

    if (!res.ok) {
      alert("Ürün güncellenemedi");
      return;
    }

    setEditingId(null);
    loadProducts();
  }

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-stone-400">
              Admin / Ürünler
            </p>
            <h1 className="text-3xl font-semibold">Ürün Yönetimi</h1>
          </div>

          <a
            href="/admin"
            className="rounded-full border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100"
          >
            ← Dashboard
          </a>
        </div>

        <form
          onSubmit={addProduct}
          className="mb-8 rounded-2xl border border-stone-200 bg-white p-6"
        >
          <h2 className="mb-4 text-lg font-semibold">Yeni Ürün Ekle</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              placeholder="Ürün adı"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-900"
              required
            />

            <input
              type="number"
              placeholder="Fiyat"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-900"
              required
            />

            <input
              placeholder="Fotoğraf URL"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />

            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-900"
            >
              <option>Üst Giyim</option>
              <option>Alt Giyim</option>
              <option>Dış Giyim</option>
            </select>

            <select
              value={form.swatch}
              onChange={(e) => setForm({ ...form, swatch: e.target.value })}
              className="rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-900"
            >
              {SWATCHES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="mt-4 rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-stone-50 hover:bg-stone-700"
          >
            Ürünü Ekle
          </button>
        </form>

        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
          <div className="grid grid-cols-6 gap-4 border-b border-stone-200 bg-stone-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <div>Ürün</div>
            <div>Kategori</div>
            <div>Fiyat</div>
            <div>Fotoğraf</div>
            <div>Renk</div>
            <div>İşlem</div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-stone-500">Yükleniyor...</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-6 items-center gap-4 px-6 py-4"
                >
                  {/* Ürün adı */}
                  <input
                    value={p.name}
                    onChange={(e) =>
                      setProducts((prev) =>
                        prev.map((x) =>
                          x.id === p.id ? { ...x, name: e.target.value } : x
                        )
                      )
                    }
                    className="rounded border border-stone-300 px-3 py-2 text-sm"
                  />

                  {/* Kategori */}
                  <select
                    value={p.category}
                    onChange={(e) =>
                      setProducts((prev) =>
                        prev.map((x) =>
                          x.id === p.id ? { ...x, category: e.target.value } : x
                        )
                      )
                    }
                    className="rounded border border-stone-300 px-3 py-2 text-sm"
                  >
                    <option>Üst Giyim</option>
                    <option>Alt Giyim</option>
                    <option>Dış Giyim</option>
                  </select>

                  {/* Fiyat */}
                  <input
                    type="number"
                    value={p.price}
                    onChange={(e) =>
                      setProducts((prev) =>
                        prev.map((x) =>
                          x.id === p.id
                            ? { ...x, price: Number(e.target.value) }
                            : x
                        )
                      )
                    }
                    className="rounded border border-stone-300 px-3 py-2 text-sm"
                  />

                  {/* Fotoğraf yolu */}
                  <input
                    value={p.imageUrl || ""}
                    onChange={(e) =>
                      setProducts((prev) =>
                        prev.map((x) =>
                          x.id === p.id
                            ? { ...x, imageUrl: e.target.value }
                            : x
                        )
                      )
                    }
                    placeholder="/products/blazer-ceket.png"
                    className="rounded border border-stone-300 px-3 py-2 text-sm"
                  />

                  {/* Renk */}
                  <select
                    value={p.swatch}
                    onChange={(e) =>
                      setProducts((prev) =>
                        prev.map((x) =>
                          x.id === p.id ? { ...x, swatch: e.target.value } : x
                        )
                      )
                    }
                    className="rounded border border-stone-300 px-3 py-2 text-sm"
                  >
                    {SWATCHES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  {/* Butonlar */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateProduct(p)}
                      className="rounded-full bg-stone-900 px-3 py-1 text-xs text-white hover:bg-stone-700"
                    >
                      Kaydet
                    </button>

                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}