"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingBag, X, Plus, Minus, User, Search, ArrowRight, Package } from "lucide-react";
import { SIZES, CATS, MAX_QTY, CART_KEY, PENDING_CHECKOUT_KEY } from "@/lib/constants";
import { LOW_STOCK } from "@/lib/orderStatus";
import { CAMPAIGN, priceCart, isCampaignProduct } from "@/lib/campaign";
import { categoryPath, productPath } from "@/lib/seo";

const fmt = (n) => `${n.toLocaleString("tr-TR")} ₺`;

// Escape'e basınca kapatma — modal ve sepet çekmecesi ortak kullanır.
function useEscape(onClose) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
}

// Sepet kalemi anahtarı: aynı ürünün farklı renk/bedenleri ayrı satırdır
function itemKey(i) {
  return `${i.id}-${i.colorId}-${i.size}`;
}

// Açık renklerde koyu, koyu renklerde açık yazı
function isDark(hex = "#ffffff") {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
}

// Seçili rengin fotoğrafı. Fotoğrafı yüklenmemiş renkte, yanıltıcı olmasın diye
// başka rengin fotoğrafı yerine rengin kendisi ve kısa bir not gösterilir.
// next/image fotoğrafı ekran boyutuna göre küçültür ve AVIF/WebP olarak sunar
// (2 MB'lık PNG yerine ~50–150 KB).
function ProductImage({ color, alt, className = "", imgClassName = "", style, compact = false, sizes = "(min-width: 1024px) 25vw, 50vw", priority = false }) {
  const hex = color?.hex || "#d6d3d1";
  if (color?.imageUrl) {
    return (
      <div className={`relative overflow-hidden ${className}`} style={{ background: hex }}>
        <Image
          key={color.imageUrl}
          src={color.imageUrl}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`object-cover ${imgClassName}`}
          style={style}
        />
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label={`${alt} — fotoğraf yakında`}
      className={`${className} flex items-end justify-center`}
      style={{ ...style, background: hex }}
    >
      {!compact && (
        <span className={`mb-14 text-xs tracking-wide ${isDark(hex) ? "text-white/80" : "text-stone-700/80"}`}>
          {color?.name} · Fotoğraf yakında
        </span>
      )}
    </div>
  );
}

function CartThumb({ item, alt, className }) {
  return <ProductImage color={{ imageUrl: item.imageUrl, hex: item.colorHex, name: item.colorName }} alt={alt} className={className} sizes="64px" compact />;
}

// Renk seçimi. Tükenen renkler seçilebilir (görmek için) ama çapraz çizgiyle gösterilir.
function ColorSwatches({ colors, selected, onPick, size = "md" }) {
  const dim = size === "sm" ? "h-4 w-4" : "h-8 w-8";
  const shown = size === "sm" ? colors.slice(0, 6) : colors;
  return (
    <div className={`flex flex-wrap items-center ${size === "sm" ? "mt-2 gap-1.5" : "gap-2"}`} role="radiogroup" aria-label="Renk seç">
      {shown.map((c) => {
        const active = selected?.id === c.id;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${c.name}${c.soldOut ? " (tükendi)" : ""}`}
            title={`${c.name}${c.soldOut ? " — tükendi" : ""}`}
            onClick={(e) => { e.stopPropagation(); onPick(c); }}
            className={`relative ${dim} shrink-0 rounded-full border transition ${
              active ? "border-stone-900 ring-2 ring-stone-900 ring-offset-2" : "border-stone-300 hover:border-stone-600"
            }`}
            style={{ background: c.hex }}
          >
            {c.soldOut && (
              <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                <span className={`block h-px w-[120%] rotate-45 ${isDark(c.hex) ? "bg-white/80" : "bg-stone-700/70"}`} />
              </span>
            )}
          </button>
        );
      })}
      {size === "sm" && colors.length > shown.length && (
        <span className="text-[11px] text-stone-500">+{colors.length - shown.length}</span>
      )}
    </div>
  );
}

// initialCat: kategori sayfasında seçili kategori · heading/breadcrumbs: kategori başlığı ve sayfa yolu
// footer: sunucuda hazırlanan alt bilgi (satıcı bilgileri .env'den okunur)
export default function Store({ products, initialUser, initialCat = "Tümü", heading = null, breadcrumbs = null, footer = null }) {
  const cat = initialCat; // kategori değişimi artık gerçek sayfa geçişi (/kategori/...)
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState(initialUser ?? null);
  // Sayfa önbellekten geldiği için oturum bilgisi tarayıcıda alınır
  useEffect(() => {
    if (initialUser !== undefined) return;
    let alive = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => alive && d?.user && setUser(d.user))
      .catch(() => {});
    return () => { alive = false; };
  }, [initialUser]);
  const [authOpen, setAuthOpen] = useState(false);
  const [checkout, setCheckout] = useState("cart"); // cart | pay
  const [picker, setPicker] = useState(null);
  // Her ürün için seçili renk (kart, önizleme ve beden seçimi aynı seçimi paylaşır)
  const [activeColor, setActiveColor] = useState({});
  const [preview, setPreview] = useState(null);
  const searchRef = useRef(null);
  const [previewZoom, setPreviewZoom] = useState(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  // Sepet tarayıcıda saklanır: Stripe'a gidip "geri dön"e basınca ya da sayfa
  // yenilenince kaybolmaz.
  const [cartLoaded, setCartLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (Array.isArray(saved)) {
        // Renkler eklenmeden önce kaydedilmiş sepet kalemlerini ürünün ilk rengine taşı
        const migrated = saved
          .map((i) => {
            if (i.colorId) return i;
            const c = products.find((p) => p.id === i.id)?.colors?.[0];
            return c ? { ...i, colorId: c.id, colorName: c.name, colorHex: c.hex, imageUrl: c.imageUrl } : null;
          })
          .filter(Boolean);
        setCart(migrated);
      }
    } catch {}
    setCartLoaded(true);
    // /account/orders gibi korumalı sayfalardan ?login=1 ile gelindiyse giriş penceresini aç
    const qs = new URLSearchParams(window.location.search);
    if (qs.get("login") === "1") setAuthOpen(true);
    // /product/:id sayfasından ?product=:id ile gelindiyse ürünü aç
    const pid = Number(qs.get("product"));
    if (pid) setPreview(products.find((p) => p.id === pid) || null);
  }, []);
  useEffect(() => {
    if (!cartLoaded) return;
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
  }, [cart, cartLoaded]);

  // Ödeme sayfasından tarayıcının geri tuşuyla dönüldüyse ayrılan stoğu bırak.
  // "pageshow", sayfa tarayıcı önbelleğinden (geri tuşu) geri geldiğinde de çalışır.
  const router = useRouter();
  useEffect(() => {
    const release = async () => {
      let orderId;
      try { orderId = sessionStorage.getItem(PENDING_CHECKOUT_KEY); } catch { return; }
      if (!orderId) return;
      try { sessionStorage.removeItem(PENDING_CHECKOUT_KEY); } catch {}
      setCheckout("cart"); // "Yönlendiriliyor…" durumunda takılı kalmasın
      try {
        await fetch("/api/checkout/abandon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: Number(orderId) }),
        });
        router.refresh(); // güncel stokları yeniden yükle
      } catch {}
    };
    release();
    const onShow = (e) => { if (e.persisted) release(); };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [router]);

  // Güncel stok (ürün + beden). Bilinmiyorsa MAX_QTY kabul edilir.
  // Seçili renk: kullanıcının seçtiği, yoksa stoğu olan ilk renk, o da yoksa ilk renk
  const colorOf = (p) => {
    if (!p?.colors?.length) return null;
    return (
      p.colors.find((c) => c.id === activeColor[p.id]) ||
      p.colors.find((c) => !c.soldOut) ||
      p.colors[0]
    );
  };
  const pickColor = (p, c) => setActiveColor((m) => ({ ...m, [p.id]: c.id }));

  // Güncel stok (ürün + renk + beden). Renk artık satışta değilse 0.
  const stockOf = (i) =>
    products.find((p) => p.id === i.id)?.colors?.find((c) => c.id === i.colorId)?.stock?.[i.size] ?? 0;

  const list = useMemo(() => {
    let l = cat === "Tümü" ? products : products.filter((p) => p.cat === cat);
    const q = query.trim().toLocaleLowerCase("tr-TR");
    if (q) l = l.filter((p) => p.name.toLocaleLowerCase("tr-TR").includes(q));
    return l;
  }, [cat, query, products]);

  const count = cart.reduce((s, i) => s + i.qty, 0);
  // Kampanya dahil fiyatlandırma — sunucudaki hesapla birebir aynı fonksiyon.
  // Kategori her zaman güncel ürün listesinden okunur (eski kayıtlı sepetlerde yoktur).
  const pricing = useMemo(
    () =>
      priceCart(
        cart.map((i) => ({
          key: itemKey(i),
          price: i.price,
          qty: i.qty,
          category: products.find((p) => p.id === i.id)?.cat,
        }))
      ),
    [cart, products]
  );
  const total = pricing.total;
  const lineOf = (key) => pricing.lines.find((l) => l.key === key);
  const campaignUnits = pricing.lines.filter((l) => l.category === CAMPAIGN.category).reduce((s, l) => s + l.qty, 0);

  const addToCart = (p, color, size) => {
    setCart((c) => {
      const key = `${p.id}-${color.id}-${size}`;
      const found = c.find((i) => itemKey(i) === key);
      const max = Math.min(MAX_QTY, color.stock?.[size] ?? 0);
      if (max <= 0) return c;
      if (found)
        return c.map((i) =>
          itemKey(i) === key ? { ...i, qty: Math.min(max, i.qty + 1) } : i
        );
      return [
        ...c,
        {
          id: p.id,
          name: p.name,
          price: p.price,
          colorId: color.id,
          colorName: color.name,
          colorHex: color.hex,
          imageUrl: color.imageUrl,
          size,
          qty: 1,
        },
      ];
    });
    setPicker(null);
    setCartOpen(true);
  };

  const setQty = (key, d) =>
    setCart((c) =>
      c
        .map((i) =>
          itemKey(i) === key
            ? { ...i, qty: d < 0 ? i.qty + d : Math.min(MAX_QTY, stockOf(i), i.qty + d) }
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
          items: cart.map((i) => ({ id: i.id, colorId: i.colorId, size: i.size, qty: i.qty })),
          customer: { name: customer.name, address: customer.address },
          acceptedTerms: customer.acceptedTerms === true,
          billing: customer.billing,
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
      // Bu sekme ödeme sayfasından tarayıcının geri tuşuyla dönerse ayrılan
      // stoğu hemen bırakabilmek için siparişi hatırla (sadece bu sekmede).
      try { sessionStorage.setItem(PENDING_CHECKOUT_KEY, String(data.orderId)); } catch {}
      window.location.assign(data.url); // Stripe'ın barındırdığı ödeme sayfası
      return null;
    } catch {
      return "Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.";
    }
  };

  const closeCart = () => { setCartOpen(false); setCheckout("cart"); };
  const [openedFromCart, setOpenedFromCart] = useState(false);

  function openProductFromCart(item) {
    const product = products.find((p) => p.id === item.id);

    if (!product) return;

    setOpenedFromCart(true);
    setCartOpen(false);
    setActiveColor((m) => ({ ...m, [product.id]: item.colorId }));
    setPreview(product);
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-stone-900/10 bg-stone-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold uppercase tracking-[0.25em]">Atölye</Link>
            <nav className="hidden gap-6 text-sm md:flex">
              {CATS.map((c) => (
                <Link
                  key={c}
                  href={c === "Tümü" ? "/" : categoryPath(c)}
                  aria-current={cat === c ? "page" : undefined}
                  className={`uppercase tracking-wide transition ${cat === c ? "text-stone-900" : "text-stone-400 hover:text-stone-600"}`}
                >
                  {c}
                </Link>
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
            {user && (
              <Link href="/account/orders" aria-label="Siparişlerim" className="flex items-center gap-2 rounded-full p-2 text-stone-500 hover:bg-stone-200/60">
                <Package size={18} />
                <span className="hidden text-sm text-stone-700 lg:inline">Siparişlerim</span>
              </Link>
            )}
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
            <Link
              key={c}
              href={c === "Tümü" ? "/" : categoryPath(c)}
              aria-current={cat === c ? "page" : undefined}
              className={`shrink-0 uppercase tracking-wide ${cat === c ? "text-stone-900" : "text-stone-400"}`}
            >
              {c}
            </Link>
          ))}
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-5 py-12 md:py-16">
        {heading ? (
          <>
            {breadcrumbs}
            <h1 className="mt-4 max-w-2xl text-4xl font-light leading-tight md:text-5xl">{heading.title}</h1>
            {heading.intro && <p className="mt-3 max-w-2xl text-stone-600">{heading.intro}</p>}
          </>
        ) : (
          <>
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-stone-400">2026 / Yeni Sezon</p>
            <h1 className="max-w-2xl text-4xl font-light leading-tight md:text-6xl">
              Tarzınızı yansıtan<br /><span className="font-semibold">kumaşlar.</span>
            </h1>
          </>
        )}
        {CAMPAIGN.active && (!heading || cat === CAMPAIGN.category) && (
          <Link
            href={categoryPath(CAMPAIGN.category)}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-2 text-sm text-rose-900 hover:bg-rose-200"
          >
            {CAMPAIGN.label}: iki üst giyim ürününden ucuz olana indirim uygulanır.
          </Link>
        )}
      </section>

      {/* GRID */}
      <main className="mx-auto max-w-6xl px-5 pb-24">
        {list.length === 0 ? (
          <p className="py-16 text-center text-sm text-stone-400">
            Aramana uyan ürün bulunamadı.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {list.map((p, index) => (
              <div key={p.id} className="group">
              <button
                onClick={() => setPreview(p)}
                aria-label={`${p.name} hızlı bakış`}
                className="relative block aspect-[3/4] w-full overflow-hidden rounded-xl bg-stone-100"
              >
                <ProductImage
                  color={colorOf(p)}
                  alt={`${p.name} — ${colorOf(p)?.name}`}
                  className="h-full w-full"
                  imgClassName="transition duration-300 group-hover:scale-105"
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  priority={index < 4}
                />

                <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />

                <span className="absolute bottom-4 left-4 text-xs uppercase tracking-widest text-white/90">
                  {p.cat}
                </span>

                {isCampaignProduct(p) && !p.soldOut && (
                  <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-medium text-white">
                    {CAMPAIGN.shortLabel}
                  </span>
                )}

                {p.soldOut ? (
                  <span className="absolute right-3 top-3 rounded-full bg-stone-900/80 px-3 py-1 text-xs font-medium text-stone-50">
                    Tükendi
                  </span>
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-medium uppercase tracking-widest text-white opacity-0 transition group-hover:opacity-100">
                    Sepete ekle
                  </span>
                )}
              </button>
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <h2 className="text-sm font-normal leading-snug">
                    <Link href={productPath(p)} className="hover:underline">{p.name}</Link>
                  </h2>
                  <span className="shrink-0 text-sm font-medium">{fmt(p.price)}</span>
                </div>
                {p.colors.length > 1 && (
                  <ColorSwatches colors={p.colors} selected={colorOf(p)} onPick={(c) => pickColor(p, c)} size="sm" />
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {footer}

      {preview && (
        <Modal
          onClose={() => {
            setPreview(null);

            if (openedFromCart) {
              setOpenedFromCart(false);
              setCartOpen(true);
            }
          }}
        >
          <div className="max-w-md pl-6 pt-24">
          <div
            className="overflow-hidden rounded-2xl bg-stone-100"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();

              setPreviewZoom({
                x: ((e.clientX - rect.left) / rect.width) * 100,
                y: ((e.clientY - rect.top) / rect.height) * 100,
              });
            }}
            onMouseLeave={() => setPreviewZoom(null)}
          >
            <ProductImage
              color={colorOf(preview)}
              alt={`${preview.name} — ${colorOf(preview)?.name}`}
              className="h-[560px] w-full"
              imgClassName="transition-transform duration-150"
              sizes="(min-width: 768px) 640px, 100vw"
              style={{
                transform: previewZoom ? "scale(2)" : "scale(1)",
                transformOrigin: previewZoom
                  ? `${previewZoom.x}% ${previewZoom.y}%`
                  : "center",
              }}
            />
          </div>

            <div className="mt-5 pb-8">
              <p className="text-xs uppercase tracking-[0.25em] text-stone-400">
                {preview.cat}
              </p>

              <h3 className="mt-2 text-2xl font-semibold">
                {preview.name}
              </h3>

              <p className="mt-2 text-xl font-medium">
                {fmt(preview.price)}
              </p>
              {isCampaignProduct(preview) && (
                <p className="mt-2 inline-block rounded-full bg-rose-100 px-3 py-1 text-xs text-rose-900">
                  {CAMPAIGN.label} — sepette otomatik uygulanır
                </p>
              )}

              <div className="mt-5">
                <p className="mb-2 text-sm">
                  <span className="text-stone-500">Renk:</span> {colorOf(preview)?.name}
                  {colorOf(preview)?.soldOut && <span className="ml-2 text-xs text-stone-400">(tükendi)</span>}
                </p>
                <ColorSwatches colors={preview.colors} selected={colorOf(preview)} onPick={(c) => pickColor(preview, c)} />
              </div>

              <Link href={productPath(preview)} className="mt-4 inline-block text-sm text-stone-600 underline hover:text-stone-900">
                Ürün detaylarını gör
              </Link>

              <p className="mt-4 text-sm leading-6 text-stone-600">
                Zarif duruşu, seçkin kumaş kalitesi ve özgün tasarımıyla stilinize
                benzersiz bir imza katacak özel bir koleksiyon parçası.
              </p>

              <button
                disabled={colorOf(preview)?.soldOut}
                onClick={() => {
                  setPreview(null);
                  setOpenedFromCart(false);
                  setPicker(preview);
                }}
                className="mt-6 w-full rounded-full bg-stone-900 py-3 text-sm font-medium text-stone-50 hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
              >
                {preview.soldOut
                  ? "Tüm renkler tükendi"
                  : colorOf(preview)?.soldOut
                  ? "Bu renk tükendi, başka bir renk seç"
                  : "Beden Seç ve Sepete Ekle"}
              </button><br></br>
            </div>
          </div>
        </Modal>
      )}

      {picker && (
        <Modal
          onClose={() => {
            setPicker(null);
            if (openedFromCart) {
              setOpenedFromCart(false);
              setCartOpen(true);
            }
          }}
        >
          <div className="flex gap-5 px-6 pt-24 pb-8">
            <ProductImage
              color={colorOf(picker)}
              alt={picker.name}
              compact
              className="h-32 w-24 shrink-0 rounded-xl shadow-sm"
              sizes="96px"
            />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.25em] text-stone-400">
                {picker.cat}
              </p>
              <h3 className="mt-1 text-lg font-semibold leading-snug">{picker.name}</h3>
              <p className="mt-1 text-sm text-stone-500">{fmt(picker.price)}</p>
              <p className="mt-1 text-sm">
                <span className="text-stone-500">Renk:</span> {colorOf(picker)?.name}
              </p>
            </div>
          </div>

          {picker.colors.length > 1 && (
            <div className="px-6 pb-5">
              <ColorSwatches colors={picker.colors} selected={colorOf(picker)} onPick={(c) => pickColor(picker, c)} />
            </div>
          )}

          <div className="px-6 pb-8">
            <p className="mb-3 text-xs uppercase tracking-widest text-stone-400">Beden Seç</p>
            <div className="grid grid-cols-5 gap-2">
              {SIZES.map((s) => {
                const left = colorOf(picker)?.stock?.[s] ?? 0;
                const out = left <= 0;
                return (
                  <div key={s} className="text-center">
                    <button
                      disabled={out}
                      onClick={() => addToCart(picker, colorOf(picker), s)}
                      aria-label={out ? `${s} bedeni tükendi` : `${s} bedeni sepete ekle`}
                      className="w-full rounded-xl border border-stone-200 py-3.5 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:bg-stone-900 hover:text-stone-50 active:scale-95 disabled:cursor-not-allowed disabled:border-dashed disabled:text-stone-300 disabled:line-through disabled:hover:bg-transparent disabled:hover:text-stone-300"
                    >
                      {s}
                    </button>
                    <p className={`mt-1 h-4 text-[11px] ${out ? "text-stone-400" : "text-amber-700"}`}>
                      {out ? "Tükendi" : left <= LOW_STOCK ? `Son ${left}` : ""}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-center text-xs text-stone-400">
              Bir beden seçtiğinizde ürün sepete eklenecektir.
            </p>
          </div>
        </Modal>
      )}

      {authOpen && (
        <Modal onClose={() => setAuthOpen(false)}>
          <div className="px-6 pt-24 pb-8">
            <AuthForm
              current={user}
              onAuth={(u) => { setUser(u); setAuthOpen(false); }}
              onLogout={() => { setUser(null); setAuthOpen(false); }}
            />
          </div>
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
            <PayForm total={total} discount={pricing.discount} defaultName={user?.name} onSubmit={startStripeCheckout} onBack={() => setCheckout("cart")} />
          ) : cart.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-stone-400">
              <ShoppingBag size={32} />
              <p className="mt-3 text-sm">Sepetin boş.</p>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                {cart.map((i) => {
                  const key = itemKey(i);
                  return (
                    <div
                      key={key}
                      onClick={() => openProductFromCart(i)}
                      className="flex gap-3 cursor-pointer rounded-xl p-2 transition hover:bg-stone-100"
                    >
                      <CartThumb
                        item={i}
                        alt={i.name}
                        className="h-20 w-16 shrink-0 rounded-xl border border-stone-200 shadow-sm"
                      />

                      <div className="flex flex-1 flex-col justify-between">
                        <div className="flex justify-between gap-2">
                          <div>
                            <p className="text-sm leading-snug">{i.name}</p>
                            <p className="flex items-center gap-1.5 text-xs text-stone-500">
                              <span className="inline-block h-2.5 w-2.5 rounded-full border border-stone-300" style={{ background: i.colorHex }} />
                              {i.colorName} · Beden {i.size}
                            </p>
                            {stockOf(i) < i.qty && (
                              <p className="text-xs text-red-600">
                                {stockOf(i) === 0 ? "Bu renk/beden tükendi, sepetinden çıkar." : `Stokta yalnızca ${stockOf(i)} adet var.`}
                              </p>
                            )}
                            {stockOf(i) >= i.qty && stockOf(i) <= LOW_STOCK && (
                              <p className="text-xs text-amber-700">Son {stockOf(i)} ürün</p>
                            )}
                          </div>
                          <span className="shrink-0 text-right text-sm">
                            {lineOf(key)?.discountQty > 0 ? (
                              <>
                                <span className="block text-xs text-stone-400 line-through">{fmt(i.price * i.qty)}</span>
                                <span className="block font-medium text-rose-700">{fmt(lineOf(key).lineTotal)}</span>
                              </>
                            ) : (
                              fmt(i.price * i.qty)
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            aria-label="Azalt"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQty(key, -1);
                            }}
                            className="rounded border border-stone-300 p-1 hover:bg-stone-100"
                          >
                            <Minus size={14} />
                          </button>

                          <span className="w-6 text-center text-sm">{i.qty}</span>

                          <button
                            aria-label="Artır"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQty(key, 1);
                            }}
                            disabled={i.qty >= Math.min(MAX_QTY, stockOf(i))}
                            className="rounded border border-stone-300 p-1 hover:bg-stone-100 disabled:opacity-40"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-stone-200 px-5 py-5">
                {campaignUnits % 2 === 1 && (
                  <button
                    onClick={() => { closeCart(); router.push(categoryPath(CAMPAIGN.category)); }}
                    className="mb-4 w-full rounded-lg bg-rose-50 px-3 py-2 text-left text-xs text-rose-900 hover:bg-rose-100"
                  >
                    Bir üst giyim ürünü daha ekle, ucuz olana %{CAMPAIGN.percent} indirim uygulansın. Ürünlere göz at
                  </button>
                )}
                <div className="space-y-1.5 text-sm">
                  {pricing.discount > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Ara toplam</span>
                        <span>{fmt(pricing.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-rose-700">
                        <span>{CAMPAIGN.label}</span>
                        <span>−{fmt(pricing.discount)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-stone-500">Toplam</span>
                    <span className="font-semibold">{fmt(total)}</span>
                  </div>
                </div>
                <div className="mb-4" />
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

  const [scrolled, setScrolled] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    const handleScroll = () => {
      setScrolled(el.scrollTop > 5);
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-stone-900/40"
        onClick={onClose}
      />

<div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl">
  {/* Header artık akışın dışında, her zaman üstte sabit bir katman */}
<div
  className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 transition-all duration-300"
  style={{
    background: scrolled
      ? "linear-gradient(to top, rgba(28,25,23,.72), rgba(12,10,9,.82))"
      : "linear-gradient(to bottom, rgba(12,10,9,.98) 0%,  rgba(22,20,18,.92) 50%, rgba(12,10,9,.98) 100%)",

    backdropFilter: scrolled
      ? "blur(24px) saturate(180%)"
      : "blur(14px) saturate(140%)",

    WebkitBackdropFilter: scrolled
      ? "blur(24px) saturate(180%)"
      : "blur(14px) saturate(140%)",

    borderBottom: scrolled
      ? "1px solid rgba(255,255,255,.08)"
      : "1px solid rgba(214,197,175,.14)",

    boxShadow: scrolled
      ? "0 8px 24px rgba(0,0,0,.30)"
      : "0 1px 0 rgba(255,255,255,.05) inset, 0 8px 32px rgba(0,0,0,.45)",
  }}
>
  <span className="text-xl font-semibold uppercase tracking-[0.35em] text-white">
    Atölye
  </span>
  <button
    onClick={onClose}
    className="rounded-full p-2 text-white transition duration-300 hover:bg-white/10"
  >
    <X size={20} />
  </button>
</div>

  {/* Scroll edilen içerik, header'ın "altından" geçer */}
  <div ref={bodyRef} className="max-h-[90vh] overflow-y-auto bg-stone-50">
    {children}
  </div>
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
  const [mode, setMode] = useState("login"); // login | register | forgot | forgot-sent
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
        <Link
          href="/account/orders"
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 py-2.5 text-sm font-medium text-stone-50 hover:bg-stone-700"
        >
          <Package size={16} /> Siparişlerim
        </Link>
        <button
          onClick={logout}
          disabled={busy}
          className="mt-3 w-full rounded-full border border-stone-300 py-2.5 text-sm hover:bg-stone-100 disabled:opacity-50"
        >
          {busy ? "Çıkılıyor…" : "Çıkış yap"}
        </button>
      </div>
    );
  }

  const submit = async () => {
    const e = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setError("Geçerli bir e-posta adresi gir."); return; }
    if (password.length < 8) { setError("Şifre en az 8 karakter olmalı."); return; }
    if (mode === "register" && password !== confirmPassword) { setError("Şifreler eşleşmiyor."); return; }

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

  const forgotSubmit = async () => {
    const e = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setError("Geçerli bir e-posta adresi gir."); return; }

    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e }),
      });
      // Bu endpoint e-posta kayıtlı olsa da olmasa da her zaman aynı genel mesajla döner
      await res.json();
      setMode("forgot-sent");
    } catch {
      setError("Sunucuya ulaşılamadı. Tekrar dene.");
    } finally {
      setBusy(false);
    }
  };

  if (mode === "forgot-sent") {
    return (
      <div>
        <h3 className="text-lg font-medium">Bağlantı gönderildi</h3>
        <p className="mt-2 text-sm text-stone-500">
          Bu e-posta sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.
        </p>
        <button onClick={() => { setMode("login"); setError(""); }} className="mt-5 w-full rounded-full border border-stone-300 py-2.5 text-sm hover:bg-stone-100">
          Girişe dön
        </button>
      </div>
    );
  }

  if (mode === "forgot") {
    return (
      <div>
        <h3 className="text-lg font-medium">Şifremi unuttum</h3>
        <div className="mt-5 space-y-3">
          <input
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && forgotSubmit()}
            placeholder="E-posta"
            type="email"
            autoComplete="email"
            className="w-full rounded border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-900"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button onClick={forgotSubmit} disabled={busy} className="w-full rounded-full bg-stone-900 py-2.5 text-sm font-medium text-stone-50 hover:bg-stone-700 disabled:opacity-50">
            {busy ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
          </button>
        </div>
        <button onClick={() => { setMode("login"); setError(""); }} className="mt-4 w-full text-center text-xs text-stone-500 hover:text-stone-900">
          Girişe dön
        </button>
      </div>
    );
  }

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
          onKeyDown={(e) => e.key === "Enter" && (mode === "register" ? confirmPassword && submit() : submit())}
          type="password"
          placeholder="Şifre (en az 8 karakter)"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="w-full rounded border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-900"
        />
        {mode === "register" && (
          <input
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            type="password"
            placeholder="Şifre (tekrar)"
            autoComplete="new-password"
            className="w-full rounded border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-900"
          />
        )}
        {mode === "login" && (
          <button onClick={() => { setMode("forgot"); setError(""); }} className="text-xs text-stone-500 hover:text-stone-900">
            Şifremi unuttum
          </button>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button onClick={submit} disabled={busy}   className="mt-2 w-full rounded-full bg-stone-900 py-3 text-sm font-medium text-stone-50 transition hover:bg-stone-700 disabled:opacity-50">

          {busy ? "Gönderiliyor…" : mode === "login" ? "Giriş yap" : "Hesap oluştur"}
        </button>
        {mode === "register" && (
          <p className="text-center text-[11px] leading-4 text-stone-500">
            Kişisel verilerin{" "}
            <a href="/kvkk" target="_blank" rel="noopener" className="underline hover:text-stone-900">KVKK Aydınlatma Metni</a>
            {" "}kapsamında işlenir.
          </p>
        )}

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="text-xs uppercase tracking-[0.2em] text-stone-400">
            veya
          </span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        <button
          type="button"
          onClick={() => (window.location.href = "/api/auth/google")}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-stone-300 bg-white py-2.5 text-sm font-medium text-stone-800 transition-all duration-300 hover:border-stone-900 hover:bg-stone-50"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.4 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.3l-6.2-5.2c-2 1.5-4.5 2.5-7.3 2.5-5.3 0-9.8-3.3-11.3-8H6.2C9.5 39.5 16.1 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.4 5.6-6.6 7.3l6.2 5.2C38.6 37.2 44 31.2 44 24c0-1.3-.1-2.3-.4-3.5z"/>
          </svg>

          Google ile devam et
        </button>
      </div>
      <button onClick={() => { setMode(mode === "login" ? "register" : "login");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setName("");
        setError("");
        }
} className="mt-4 w-full text-center text-xs text-stone-500 hover:text-stone-900">
        {mode === "login" ? "Hesabın yok mu? Kayıt ol" : "Zaten üye misin? Giriş yap"}
      </button>
    </div>
  );
}

function PayForm({ total, discount = 0, defaultName, onSubmit, onBack }) {
  const [name, setName] = useState(defaultName || "");
  const [address, setAddress] = useState("");
  const [billingType, setBillingType] = useState("individual");
  const [sameAddress, setSameAddress] = useState(true);
  const [billingAddress, setBillingAddress] = useState("");
  const [tckn, setTckn] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [taxOffice, setTaxOffice] = useState("");
  const [accepted, setAccepted] = useState(false); // Mesafeli Sözleşmeler Yönetmeliği: ödeme öncesi onay
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const corporate = billingType === "corporate";
  const digits = (v, n) => v.replace(/\D/g, "").slice(0, n);

  const submit = async () => {
    if (!name.trim()) { setError("Ad Soyad zorunlu."); return; }
    if (!address.trim()) { setError("Teslimat adresi zorunlu."); return; }
    if (!sameAddress && !billingAddress.trim()) { setError("Fatura adresini yaz ya da teslimat adresiyle aynı seç."); return; }
    if (corporate) {
      if (!companyName.trim()) { setError("Firma unvanı zorunlu."); return; }
      if (taxId.length !== 10) { setError("Vergi numarası 10 haneli olmalı."); return; }
      if (!taxOffice.trim()) { setError("Vergi dairesi zorunlu."); return; }
    } else if (tckn && tckn.length !== 11) {
      setError("T.C. kimlik numarası 11 haneli olmalı (ya da boş bırak)."); return;
    }
    if (!accepted) { setError("Devam etmek için Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi'ni onaylamalısın."); return; }
    setError("");
    setBusy(true);
    const err = await onSubmit({
      acceptedTerms: true,
      name: name.trim(),
      address: address.trim(),
      billing: {
        type: billingType,
        sameAddress,
        address: billingAddress.trim(),
        taxId: corporate ? taxId : tckn,
        companyName: companyName.trim(),
        taxOffice: taxOffice.trim(),
      },
    });
    setBusy(false);
    if (err) setError(err);
  };

  const clear = (fn) => (v) => { fn(v); setError(""); };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
        <Field label="Ad Soyad" value={name} onChange={clear(setName)} placeholder="Adın soyadın" />
        <Field label="Adres" value={address} onChange={clear(setAddress)} placeholder="Teslimat adresi" />

        <fieldset className="pt-3">
          <legend className="mb-2 text-xs uppercase tracking-wide text-stone-500">Fatura</legend>
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            {[["individual", "Bireysel"], ["corporate", "Kurumsal"]].map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={billingType === k}
                onClick={() => { setBillingType(k); setError(""); }}
                className={`rounded-full border py-2 text-sm ${billingType === k ? "border-stone-900 bg-stone-900 text-stone-50" : "border-stone-300 hover:border-stone-900"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-3">
            {corporate ? (
              <>
                <Field label="Firma unvanı" value={companyName} onChange={clear(setCompanyName)} placeholder="Örn. Atölye Tekstil Ltd. Şti." />
                <div className="flex gap-2">
                  <Field label="Vergi no" value={taxId} onChange={clear((v) => setTaxId(digits(v, 10)))} placeholder="10 hane" inputMode="numeric" />
                  <Field label="Vergi dairesi" value={taxOffice} onChange={clear(setTaxOffice)} placeholder="Örn. Kadıköy" />
                </div>
              </>
            ) : (
              <Field label="T.C. kimlik no (isteğe bağlı)" value={tckn} onChange={clear((v) => setTckn(digits(v, 11)))} placeholder="11 hane" inputMode="numeric" />
            )}
            <label className="flex items-center gap-2 text-sm text-stone-600">
              <input type="checkbox" checked={sameAddress} onChange={(e) => setSameAddress(e.target.checked)} />
              Fatura adresim teslimat adresiyle aynı
            </label>
            {!sameAddress && (
              <Field label="Fatura adresi" value={billingAddress} onChange={clear(setBillingAddress)} placeholder="Fatura adresi" />
            )}
          </div>
        </fieldset>

        <p className="pt-2 text-xs text-stone-400">
          Kart bilgisi Stripe'ın kendi güvenli ödeme sayfasında alınır, bu siteden hiç geçmez.
          Test modu kartı: <span className="font-mono">4242 4242 4242 4242</span>, ileri bir tarih, herhangi bir CVC.
        </p>
        <p className="text-xs text-stone-400">
          Kargoya verilene kadar siparişini tek tıkla iptal edebilir, teslimattan sonra 14 gün içinde iade edebilirsin.
        </p>
        <label className="flex items-start gap-2 rounded-lg border border-stone-200 p-3 text-xs leading-5 text-stone-600">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => { setAccepted(e.target.checked); setError(""); }}
            className="mt-0.5"
          />
          <span>
            <a href="/on-bilgilendirme-formu" target="_blank" rel="noopener" className="underline hover:text-stone-900">Ön Bilgilendirme Formu</a>
            {"'nu ve "}
            <a href="/mesafeli-satis-sozlesmesi" target="_blank" rel="noopener" className="underline hover:text-stone-900">Mesafeli Satış Sözleşmesi</a>
            {"'ni okudum, onaylıyorum."}
          </span>
        </label>
      </div>
      <div className="border-t border-stone-200 px-5 py-5">
        {error && <p className="mb-3 text-xs text-red-600" role="alert">{error}</p>}
        {discount > 0 && (
          <div className="mb-1 flex justify-between text-sm text-rose-700">
            <span>{CAMPAIGN.label}</span>
            <span>−{fmt(discount)}</span>
          </div>
        )}
        <div className="mb-4 flex justify-between text-sm">
          <span className="text-stone-500">Ödenecek (KDV dahil)</span>
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