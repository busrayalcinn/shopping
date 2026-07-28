# Atölye — Kıyafet Mağazası (Next.js)

PostgreSQL (Prisma ORM), gerçek kimlik doğrulama, korumalı sipariş API'si,
Stripe (test modu) ile gerçekçi ödeme akışı.

## Çalıştırma

Gereken: Node.js 18+ ve bir PostgreSQL veritabanı (örn. [Neon](https://neon.tech)).

```bash
npm install
cp .env.example .env
```

`.env` içine kendi değerlerini gir:

* `DATABASE_URL` — PostgreSQL bağlantı adresin (`postgresql://kullanici:sifre@host/db?sslmode=require`)
* `SESSION_SECRET` — en az 32 karakter, üretmek için:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
* `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — aşağıdaki ilgili bölümlere bak.

Veritabanı şemasını oluştur ve demo ürünleri ekle:

```bash
npm run db:migrate   # Prisma migration'ları çalıştırır (ilk seferde tablo isteyecek)
npm run db:seed       # PostgreSQL'e demo ürünleri yazar
```

Sunucuyu başlat:

```bash
npm run dev
```

Tarayıcıda aç: http://localhost:3000


### Stripe kurulumu (test modu, ücretsiz)
1. [dashboard.stripe.com](https://dashboard.stripe.com) üzerinde ücretsiz bir hesap aç (gerçek kart istemez, test modu varsayılan).
2. `Developers → API keys` sayfasından **test** secret key'i kopyala → `.env` içinde `STRIPE_SECRET_KEY`.
3. Webhook'u yerelde dinlemek için [Stripe CLI](https://stripe.com/docs/stripe-cli) kur ve çalıştır:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```
   Terminalde basılan `whsec_...` değerini `.env` içindeki `STRIPE_WEBHOOK_SECRET`'a koy.
4. Ödeme sayfasında test kartı kullan: `4242 4242 4242 4242`, ileri bir tarih, herhangi bir CVC.

## Akış
1. Ürünleri filtrele/ara, bir ürüne tıkla, beden seç → sepete eklenir.
2. Sepette "Giriş yap ve devam et" → kayıt ol veya giriş yap (bcrypt ile hash'lenmiş şifre, httpOnly oturum çerezi).
3. Ad/adres formunu doldur → `/api/checkout` sepeti sunucuda yeniden fiyatlandırır, sipariş `pending` durumuyla
   ve sipariş kalemleriyle (OrderItem) veritabanına yazılır, Stripe Checkout Session açılır.
4. Kullanıcı Stripe'ın kendi barındırdığı ödeme sayfasına yönlendirilir — kart bilgisi bu siteden hiç geçmez.
5. Ödeme tamamlanınca Stripe `checkout.session.completed` webhook'unu `/api/webhook`'a gönderir; imza doğrulanır
   ve sipariş `paid` olarak işaretlenir. Kullanıcı `/order/success`'e döner (webhook henüz ulaşmadıysa o sayfa
   session'ı Stripe'tan tekrar sorgulayıp yedek bir doğrulama yapar). İptal edilirse `/order/cancel`'a döner.

## Yapı
- `prisma/schema.prisma` — veritabanı şeması (User, PasswordReset, Order, OrderItem, Product)
- `prisma/seed/products.js` — demo ürün seed script'i (`npm run db:seed`)
- `src/lib/db.js` — Prisma sorguları (kullanıcı, şifre sıfırlama, ürün, sipariş + ödeme durumu)
- `src/lib/auth.js` — oturum yönetimi (jose JWT, httpOnly çerez)
- `src/lib/cart.js` — sepet doğrulama/fiyatlandırma (istemciden gelen fiyata güvenilmez, veritabanından async okur)
- `src/lib/constants.js` — arayüz ve API'nin ortak sabitleri
- `src/app/page.js` — ana sayfa (sunucu bileşeni; ürünleri ve oturumu sunucuda hazırlar)
- `src/components/Store.js` — arayüz (istemci bileşeni)
- `src/app/api/auth/*` — register / login / logout / me / forgot-password / reset-password
- `src/app/api/products/route.js` — GET ürünler
- `src/app/api/orders/route.js` — GET kendi siparişlerini listele (oturum gerekli)
- `src/app/api/checkout/route.js` — POST: pending sipariş + kalemlerini oluştur, Stripe Checkout Session aç
- `src/app/api/webhook/route.js` — Stripe webhook: imza doğrula, ödemeyi `paid` işaretle
- `src/app/order/success/page.js`, `src/app/order/cancel/page.js` — Stripe'tan dönüş sayfaları
- `src/app/admin/*` — ürün, sipariş ve kullanıcı yönetimi (yalnızca `role: admin`)
