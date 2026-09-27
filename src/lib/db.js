import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Next.js dev modunda her reload'da yeni bağlantı açılmasın diye global cache
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// =========================
// USER
// =========================

export async function getUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

export async function createUser({ email, password, name }) {
  const passwordHash = await bcrypt.hash(password, 12);

  return prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name: name || null,
      passwordHash,
    },
  });
}

export async function verifyUser(email, password) {
  const user = await getUserByEmail(email);

  // Google ile açılmış hesapların şifresi olmayabilir
  if (!user || !user.passwordHash) return null;

  const ok = await bcrypt.compare(password, user.passwordHash);

  if (!ok) return null;

  return user;
}

// =========================
// PASSWORD RESET
// =========================

export async function createPasswordReset(userId) {
  const token = crypto.randomBytes(32).toString("hex");

  const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 dk

  await prisma.passwordReset.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return token;
}

export async function getValidPasswordReset(token) {
  return prisma.passwordReset.findFirst({
    where: {
      token,
      used: false,
      expiresAt: {
        gt: new Date(),
      },
    },
  });
}

export async function consumePasswordReset(token) {
  return prisma.passwordReset.update({
    where: { token },
    data: { used: true },
  });
}

export async function updateUserPassword(userId, passwordHash) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

// =========================
// PRODUCT
// =========================

const SIZE_ORDER = ["XS", "S", "M", "L", "XL"];

function toStockMap(variants = []) {
  const stock = Object.fromEntries(SIZE_ORDER.map((s) => [s, 0]));
  for (const v of variants) stock[v.size] = v.stock;
  return stock;
}

// Mağaza vitrini: yalnızca satıştaki ürünler + beden bazlı stok
export async function getProducts() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { id: "asc" },
    include: { variants: true },
  });

  return products.map((p) => {
    const stock = toStockMap(p.variants);
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      cat: p.category,
      swatch: p.swatch,
      text: p.textColor,
      imageUrl: p.imageUrl,
      stock,
      soldOut: Object.values(stock).every((n) => n <= 0),
    };
  });
}

// Sepet doğrulaması için: verilen id listesindeki ürünleri getirir.
export async function getProductsByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: { variants: true },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    active: p.active,
    stock: toStockMap(p.variants),
  }));
}

export async function getUserByGoogleId(id) {
  return prisma.user.findUnique({
    where: {
      googleId: id,
    },
  });
}

// Sipariş fonksiyonları src/lib/orders.js dosyasına taşındı.
