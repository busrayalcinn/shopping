# Atölye — Kıyafet Mağazası (Next.js)

Frontend + backend tek projede: SQLite veritabanı, gerçek kimlik doğrulama, korumalı sipariş API'si.

## Çalıştırma

Gereken: Node.js 18+

```bash
npm install
cp .env.example .env 
npm run dev   
```

SESSION_SECRET üretmek için:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Tarayıcıda aç: http://localhost:3000
Veritabanı (`data/store.db`) ve ürünler ilk açılışta otomatik oluşur.

## Akış
1. Ürünleri filtrele/ara, bir ürüne tıkla, beden seç → sepete eklenir.
2. Sepette "Giriş yap ve devam et" → kayıt ol veya giriş yap (bcrypt ile hash'lenmiş şifre, httpOnly oturum çerezi).
3. Ödeme formunu doldur → sipariş `/api/orders`'a gider.
4. Sunucu fiyatı/bedeni/adedi yeniden doğrular ve siparişi veritabanına tek transaction'da yazar.

## Yapı
- `src/lib/db.js` — SQLite katmanı (şema, seed, sorgular)
- `src/lib/auth.js` — oturum yönetimi (jose JWT, httpOnly çerez)
- `src/lib/constants.js` — arayüz ve API'nin ortak sabitleri
- `src/app/page.js` — ana sayfa (sunucu bileşeni; ürünleri ve oturumu sunucuda hazırlar)
- `src/components/Store.js` — arayüz (istemci bileşeni)
- `src/app/api/auth/*` — register / login / logout / me
- `src/app/api/products/route.js` — GET ürünler
- `src/app/api/orders/route.js` — POST sipariş oluştur / GET kendi siparişlerini listele (oturum gerekli)
