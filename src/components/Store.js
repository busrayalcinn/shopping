"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { ShoppingBag, X, Plus, Minus, User, Search, ArrowRight } from "lucide-react";
import { SIZES, CATS, MAX_QTY } from "@/lib/constants";

const fmt = (n) => `${n.toLocaleString("tr-TR")} ₺`;

// Escape'e basınca kapatma — modal ve sepet çekmecesi ortak kullanır.
function useEscape(onClose) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
}

export default function Store({ products, initialUser = null }) {
  const [cat, setCat] = useState("Tümü");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState(initialUser); // sunucudan gelen oturum
  const [authOpen, setAuthOpen] = useState(false);
  const [checkout, setCheckout] = useState("cart"); // cart | pay
  const [picker, setPicker] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const list = useMemo(() => {
    let l = cat === "Tümü" ? products : products.filter((p) => p.cat === cat);
    const q = query.trim().toLocaleLowerCase("tr-TR");
    if (q) l = l.filter((p) => p.name.toLocaleLowerCase("tr-TR").includes(q));
    return l;
  }, [cat, query, products]);

  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.qty * i.price, 0);

  const addToCart = (p, size) => {
    setCart((c) => {
      const key = `${p.id}-${size}`;
      const found = c.find((i) => `${i.id}-${i.size}` === key);
      if (found)
        return c.map((i) =>
          `${i.id}-${i.size}` === key ? { ...i, qty: Math.min(MAX_QTY, i.qty + 1) } : i
        );
      return [...c, { id: p.id, name: p.name, price: p.price, size, qty: 1 }];
    });
    setPicker(null);
    setCartOpen(true);
  };

  const setQty = (key, d) =>
    setCart((c) =>
      c
        .map((i) =>
          `${i.id}-${i.size}` === key
            ? { ...i, qty: Math.min(MAX_QTY, i.qty + d) }
            : i
        )
        .filter((i) => i.qty > 0)
    );

  const startCheckout = () => {
    if (!user) { setAuthOpen(true); return; }
    setCheckout("pay");
  };

  // ---- /api/checkout'a sipariş+müşteri bilgisini gönderir, dönen Stripe Checkout
  // URL'sine yönlendirir. Ödeme Stripe'ın kendi barındırdığı sayfada yapılır;
  // sonuç /order/success ya da /order/cancel'a geri döner. ----
  const startStripeCheckout = async (customer) => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({ id: i.id, size: i.size, qty: i.qty })),
          customer,
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        // Oturum süresi dolmuş olabilir: kullanıcıyı girişe yönlendir.
        setUser(null);
        setCheckout("cart");
        setAuthOpen(true);
        return null;
      }
      if (!res.ok || !data.ok) return data.error || "Ödeme başlatılamadı.";
      window.location.assign(data.url); // Stripe'ın barındırdığı ödeme sayfası
      return null;
    } catch {
      return "Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.";
    }
  };

  const closeCart = () => { setCartOpen(false); setCheckout("cart"); };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-stone-900/10 bg-stone-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold uppercase tracking-[0.25em]">Atölye</span>
            <nav className="hidden gap-6 text-sm md:flex">
              {CATS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`uppercase tracking-wide transition ${cat === c ? "text-stone-900" : "text-stone-400 hover:text-stone-600"}`}
                >
                  {c}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {searchOpen && (
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && (setSearchOpen(false), setQuery(""))}
                  placeholder="Ürün ara…"
                  className="mr-1 w-40 rounded-full border border-stone-300 bg-stone-50 px-3 py-1.5 text-sm outline-none focus:border-stone-900 sm:w-56"
                />
              )}
              <button
                aria-label={searchOpen ? "Aramayı kapat" : "Ara"}
                onClick={() => { if (searchOpen) setQuery(""); setSearchOpen(!searchOpen); }}
                className="rounded-full p-2 text-stone-500 hover:bg-stone-200/60"
              >
                {searchOpen ? <X size={18} /> : <Search size={18} />}
              </button>
            </div>
            <button aria-label="Hesap" onClick={() => setAuthOpen(true)} className="flex items-center gap-2 rounded-full p-2 text-stone-500 hover:bg-stone-200/60">
              <User size={18} />
              {user && <span className="hidden text-sm text-stone-700 sm:inline">{user.name}</span>}
            </button>
            <button aria-label={`Sepet, ${count} ürün`} onClick={() => setCartOpen(true)} className="relative rounded-full p-2 text-stone-700 hover:bg-stone-200/60">
              <ShoppingBag size={18} />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 text-[10px] font-bold text-stone-50">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
        {/* Mobil kategori şeridi (md altında üst nav gizli) */}
        <div className="flex gap-4 overflow-x-auto px-5 pb-3 text-sm md:hidden">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 uppercase tracking-wide ${cat === c ? "text-stone-900" : "text-stone-400"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-stone-400">2026 / Yeni Sezon</p>
        <h1 className="max-w-2xl text-4xl font-light leading-tight md:text-6xl">
            Tarzınızı yansıtan<br /><span className="font-semibold">kumaşlar.</span>
        </h1>
      </section>

      {/* GRID */}
      <main className="mx-auto max-w-6xl px-5 pb-24">
        {list.length === 0 ? (
          <p className="py-16 text-center text-sm text-stone-400">
            Aramana uyan ürün bulunamadı.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {list.map((p) => (
              <div key={p.id} className="group">
                <button onClick={() => setPicker(p)} className={`relative flex aspect-[3/4] w-full items-end overflow-hidden ${p.swatch}`}>
                  <span className={`p-4 text-left text-xs uppercase tracking-widest ${p.text} opacity-60`}>{p.cat}</span>
                  <span className="absolute inset-0 flex items-center justify-center bg-stone-900/0 text-sm font-medium uppercase tracking-widest text-stone-50 opacity-0 transition group-hover:bg-stone-900/30 group-hover:opacity-100">
                    Sepete ekle
                  </span>
                </button>
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <h3 className="text-sm leading-snug">{p.name}</h3>
                  <span className="shrink-0 text-sm font-medium">{fmt(p.price)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {picker && (
        <Modal onClose={() => setPicker(null)}>
          <h3 className="text-lg font-medium">{picker.name}</h3>
          <p className="mt-1 text-sm text-stone-500">{fmt(picker.price)} · Beden seç</p>
          <div className="mt-5 grid grid-cols-5 gap-2">
            {SIZES.map((s) => (
              <button key={s} onClick={() => addToCart(picker, s)} className="rounded border border-stone-300 py-3 text-sm font-medium hover:border-stone-900 hover:bg-stone-900 hover:text-stone-50">
                {s}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {authOpen && (
        <Modal onClose={() => setAuthOpen(false)}>
          <AuthForm current={user} onAuth={(u) => { setUser(u); setAuthOpen(false); }} onLogout={() => { setUser(null); setAuthOpen(false); }} />
        </Modal>
      )}

      {cartOpen && (
        <CartDrawer onClose={closeCart}>
          <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest">
              {checkout === "pay" ? "Ödeme" : "Sepet"}
            </h2>
            <button aria-label="Kapat" onClick={closeCart} className="p-1 text-stone-500 hover:text-stone-900"><X size={20} /></button>
          </div>

          {checkout === "pay" ? (
            <PayForm total={total} defaultName={user?.name} onSubmit={startStripeCheckout} onBack={() => setCheckout("cart")} />
          ) : cart.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-stone-400">
              <ShoppingBag size={32} />
              <p className="mt-3 text-sm">Sepetin boş.</p>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                {cart.map((i) => {
                  const key = `${i.id}-${i.size}`;
                  return (
                    <div key={key} className="flex gap-3">
                      <div className="h-20 w-16 shrink-0 bg-stone-200" />
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="flex justify-between gap-2">
                          <div>
                            <p className="text-sm leading-snug">{i.name}</p>
                            <p className="text-xs text-stone-500">Beden {i.size}</p>
                          </div>
                          <span className="text-sm">{fmt(i.price * i.qty)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button aria-label="Azalt" onClick={() => setQty(key, -1)} className="rounded border border-stone-300 p-1 hover:bg-stone-100"><Minus size={14} /></button>
                          <span className="w-6 text-center text-sm">{i.qty}</span>
                          <button aria-label="Artır" onClick={() => setQty(key, 1)} disabled={i.qty >= MAX_QTY} className="rounded border border-stone-300 p-1 hover:bg-stone-100 disabled:opacity-40"><Plus size={14} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-stone-200 px-5 py-5">
                <div className="mb-4 flex justify-between text-sm">
                  <span className="text-stone-500">Ara toplam</span>
                  <span className="font-semibold">{fmt(total)}</span>
                </div>
                <button onClick={startCheckout} className="flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 py-3 text-sm font-medium text-stone-50 hover:bg-stone-700">
                  {user ? "Ödemeye geç" : "Giriş yap ve devam et"} <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}
        </CartDrawer>
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-stone-900/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-lg bg-stone-50 p-6 shadow-xl">
        <button aria-label="Kapat" onClick={onClose} className="absolute right-4 top-4 text-stone-400 hover:text-stone-900"><X size={18} /></button>
        {children}
      </div>
    </div>
  );
}

function CartDrawer({ children, onClose }) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-stone-900/40" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-stone-50 shadow-xl">{children}</div>
    </div>
  );
}

function AuthForm({ current, onAuth, onLogout }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (current) {
    const logout = async () => {
      setBusy(true);
      try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
      setBusy(false);
      onLogout();
    };
    return (
      <div>
        <h3 className="text-lg font-medium">Merhaba, {current.name}</h3>
        <p className="mt-1 text-sm text-stone-500">{current.email}</p>
        <button onClick={logout} disabled={busy} className="mt-5 w-full rounded-full border border-stone-300 py-2.5 text-sm hover:bg-stone-100 disabled:opacity-50">
          {busy ? "Çıkılıyor…" : "Çıkış yap"}
        </button>
      </div>
    );
  }

  const submit = async () => {
    const e = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setError("Geçerli bir e-posta adresi gir."); return; }
    if (password.length < 8) { setError("Şifre en az 8 karakter olmalı."); return; }

    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "login" ? { email: e, password } : { email: e, password, name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.error || "Bir şeyler ters gitti."); return; }
      onAuth(data.user);
    } catch {
      setError("Sunucuya ulaşılamadı. Tekrar dene.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium">{mode === "login" ? "Giriş yap" : "Kayıt ol"}</h3>
      <div className="mt-5 space-y-3">
        {mode === "register" && (
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            placeholder="Ad (isteğe bağlı)"
            className="w-full rounded border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-900"
          />
        )}
        <input
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder="E-posta"
          type="email"
          autoComplete="email"
          className="w-full rounded border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-900"
        />
        <input
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          type="password"
          placeholder="Şifre (en az 8 karakter)"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="w-full rounded border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-900"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button onClick={submit} disabled={busy} className="w-full rounded-full bg-stone-900 py-2.5 text-sm font-medium text-stone-50 hover:bg-stone-700 disabled:opacity-50">
          {busy ? "Gönderiliyor…" : mode === "login" ? "Giriş yap" : "Hesap oluştur"}
        </button>
      </div>
      <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="mt-4 w-full text-center text-xs text-stone-500 hover:text-stone-900">
        {mode === "login" ? "Hesabın yok mu? Kayıt ol" : "Zaten üye misin? Giriş yap"}
      </button>
    </div>
  );
}

function PayForm({ total, defaultName, onSubmit, onBack }) {
  const [name, setName] = useState(defaultName || "");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!name.trim()) { setError("Ad Soyad zorunlu."); return; }
    if (!address.trim()) { setError("Teslimat adresi zorunlu."); return; }
    setError("");
    setBusy(true);
    const err = await onSubmit({ name: name.trim(), address: address.trim() });
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
        <Field label="Ad Soyad" value={name} onChange={(v) => { setName(v); setError(""); }} placeholder="Adın soyadın" />
        <Field label="Adres" value={address} onChange={(v) => { setAddress(v); setError(""); }} placeholder="Teslimat adresi" />
        <p className="pt-2 text-xs text-stone-400">
          Kart bilgisi Stripe'ın kendi güvenli ödeme sayfasında alınır, bu siteden hiç geçmez.
          Test modu kartı: <span className="font-mono">4242 4242 4242 4242</span>, ileri bir tarih, herhangi bir CVC.
        </p>
      </div>
      <div className="border-t border-stone-200 px-5 py-5">
        {error && <p className="mb-3 text-xs text-red-600">{error}</p>}
        <div className="mb-4 flex justify-between text-sm">
          <span className="text-stone-500">Ödenecek</span>
          <span className="font-semibold">{fmt(total)}</span>
        </div>
        <button onClick={submit} disabled={busy} className="w-full rounded-full bg-stone-900 py-3 text-sm font-medium text-stone-50 hover:bg-stone-700 disabled:opacity-50">
          {busy ? "Yönlendiriliyor…" : "Stripe ile öde"}
        </button>
        <button onClick={onBack} className="mt-2 w-full text-center text-xs text-stone-500 hover:text-stone-900">Sepete dön</button>
      </div>
    </div>
  );
}

function Field({ label, placeholder, value, onChange, inputMode }) {
  const controlled = onChange !== undefined;
  return (
    <label className="block flex-1">
      <span className="mb-1 block text-xs uppercase tracking-wide text-stone-500">{label}</span>
      <input
        {...(controlled ? { value: value ?? "", onChange: (e) => onChange(e.target.value) } : {})}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full rounded border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-900"
      />
    </label>
  );
}
