// Veritabanı katmanı: better-sqlite3 (senkron, hızlı, tek dosya).
// İlk açılışta şemayı kurar ve ürünleri yükler. Dosya: data/store.db
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const DB_PATH = path.join(process.cwd(), "data", "store.db");

function createDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL"); // eşzamanlı okuma/yazmada güvenli ve hızlı
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name          TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id     INTEGER PRIMARY KEY,
      name   TEXT NOT NULL,
      price  INTEGER NOT NULL CHECK (price >= 0),
      cat    TEXT NOT NULL,
      swatch TEXT NOT NULL,
      text   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id),
      name       TEXT NOT NULL,
      address    TEXT NOT NULL,
      total      INTEGER NOT NULL,
      status     TEXT NOT NULL DEFAULT 'received',
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      name       TEXT NOT NULL,   -- sipariş anındaki ürün adı
      price      INTEGER NOT NULL, -- sipariş anındaki birim fiyat
      size       TEXT NOT NULL,
      qty        INTEGER NOT NULL CHECK (qty > 0),
      line_total INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(order_id);
  `);

  // Mevcut kurulumlarda orders tablosuna ödeme kolonlarını ekle (idempotent migration).
  const orderCols = db.prepare("PRAGMA table_info(orders)").all().map((c) => c.name);
  if (!orderCols.includes("payment_status")) {
    db.exec("ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending'");
  }
  if (!orderCols.includes("stripe_session_id")) {
    db.exec("ALTER TABLE orders ADD COLUMN stripe_session_id TEXT");
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id)");
  }

  // Ürünler boşsa başlangıç verisini yükle
  const count = db.prepare("SELECT COUNT(*) AS c FROM products").get().c;
  if (count === 0) {
    const seed = db.prepare(
      "INSERT INTO products (id, name, price, cat, swatch, text) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const PRODUCTS = [
      [1, "Oversize Keten Gömlek", 540, "Üst Giyim", "bg-stone-300", "text-stone-800"],
      [2, "Yüksek Bel Pantolon", 720, "Alt Giyim", "bg-stone-800", "text-stone-100"],
      [3, "Yün Karışımlı Kazak", 890, "Üst Giyim", "bg-amber-200", "text-stone-800"],
      [4, "Pamuklu Basic Tişört", 260, "Üst Giyim", "bg-stone-100", "text-stone-800"],
      [5, "Geniş Paça Jean", 980, "Alt Giyim", "bg-indigo-300", "text-stone-900"],
      [6, "Uzun Trençkot", 1850, "Dış Giyim", "bg-stone-400", "text-stone-900"],
      [7, "Triko Hırka", 650, "Üst Giyim", "bg-rose-200", "text-stone-800"],
      [8, "Pileli Midi Etek", 580, "Alt Giyim", "bg-emerald-200", "text-stone-800"],
    ];
    db.transaction(() => PRODUCTS.forEach((p) => seed.run(...p)))();
  }

  return db;
}

// Dev'de hot-reload yeni bağlantı açmasın diye global'de tekil tutulur.
const g = globalThis;
export const db = g.__atolyeDb ?? createDb();
if (process.env.NODE_ENV !== "production") g.__atolyeDb = db;

export const newId = (prefix) => `${prefix}_${crypto.randomBytes(8).toString("hex")}`;

// ---- Sorgular ----

export const getProducts = () =>
  db.prepare("SELECT * FROM products ORDER BY id").all();

export const getProductsByIds = (ids) => {
  if (ids.length === 0) return [];
  const marks = ids.map(() => "?").join(",");
  return db.prepare(`SELECT * FROM products WHERE id IN (${marks})`).all(...ids);
};

export const getUserByEmail = (email) =>
  db.prepare("SELECT * FROM users WHERE email = ?").get(email);

export const getUserById = (id) =>
  db.prepare("SELECT id, email, name FROM users WHERE id = ?").get(id);

export const createUser = ({ email, passwordHash, name }) => {
  const id = newId("usr");
  db.prepare("INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)")
    .run(id, email, passwordHash, name);
  return { id, email, name };
};

// Sipariş + kalemleri tek transaction'da yazar: ya hepsi ya hiçbiri.
export const createOrder = db.transaction(({ userId, name, address, total, lines }) => {
  const id = newId("ord");
  db.prepare("INSERT INTO orders (id, user_id, name, address, total) VALUES (?, ?, ?, ?, ?)")
    .run(id, userId, name, address, total);
  const insertItem = db.prepare(
    "INSERT INTO order_items (order_id, product_id, name, price, size, qty, line_total) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  for (const l of lines) {
    insertItem.run(id, l.productId, l.name, l.price, l.size, l.qty, l.lineTotal);
  }
  return { id, total };
});

export const getOrdersForUser = (userId) => {
  const orders = db
    .prepare(
      "SELECT id, name, address, total, status, payment_status AS paymentStatus, created_at AS createdAt FROM orders WHERE user_id = ? ORDER BY created_at DESC"
    )
    .all(userId);
  const items = db.prepare(
    "SELECT name, size, qty, price, line_total AS lineTotal FROM order_items WHERE order_id = ?"
  );
  return orders.map((o) => ({ ...o, items: items.all(o.id) }));
};

// Sipariş oluşturulduktan sonra Stripe Checkout Session'ını siparişe bağlar.
export const attachStripeSession = (orderId, stripeSessionId) =>
  db.prepare("UPDATE orders SET stripe_session_id = ? WHERE id = ?").run(stripeSessionId, orderId);

// Webhook (ya da success sayfasındaki doğrulama) ödemeyi onaylayınca çağrılır.
// İdempotent: aynı session için tekrar çağrılsa da sorun çıkarmaz.
export const markOrderPaidBySession = (stripeSessionId) => {
  db.prepare("UPDATE orders SET payment_status = 'paid' WHERE stripe_session_id = ? AND payment_status != 'paid'")
    .run(stripeSessionId);
  return db
    .prepare(
      "SELECT id, user_id AS userId, name, address, total, status, payment_status AS paymentStatus FROM orders WHERE stripe_session_id = ?"
    )
    .get(stripeSessionId);
};

export const getOrderWithItems = (orderId, userId) => {
  const order = db
    .prepare(
      "SELECT id, name, address, total, status, payment_status AS paymentStatus, created_at AS createdAt FROM orders WHERE id = ? AND user_id = ?"
    )
    .get(orderId, userId);
  if (!order) return null;
  const items = db
    .prepare("SELECT name, size, qty, price, line_total AS lineTotal FROM order_items WHERE order_id = ?")
    .all(orderId);
  return { ...order, items };
};

export const getOrderByStripeSession = (stripeSessionId, userId) =>
  db
    .prepare(
      "SELECT id, name, address, total, status, payment_status AS paymentStatus, created_at AS createdAt FROM orders WHERE stripe_session_id = ? AND user_id = ?"
    )
    .get(stripeSessionId, userId);
