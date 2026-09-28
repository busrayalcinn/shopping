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

const COLOR_INCLUDE = {
  colors: {
    where: { active: true },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    include: { variants: true },
  },
};

function toColor(c) {
  const stock = toStockMap(c.variants);
  return {
    id: c.id,
    name: c.name,
    hex: c.hex,
    imageUrl: c.imageUrl,
    stock,
    soldOut: Object.values(stock).every((n) => n <= 0),
  };
}

// Mağaza vitrini: yalnızca satıştaki ürünler + renkler + renk/beden bazlı stok
export async function getProducts() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { id: "asc" },
    include: COLOR_INCLUDE,
  });

  const list = products
    .map((p) => {
      const colors = p.colors.map(toColor);
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        cat: p.category,
        swatch: p.swatch,
        text: p.textColor,
        imageUrl: colors.find((c) => c.imageUrl)?.imageUrl || p.imageUrl,
        colors,
        soldOut: colors.every((c) => c.soldOut),
      };
    })
    .filter((p) => p.colors.length > 0); // rengi olmayan ürün satılamaz
    
    const i = list.findIndex((p) => p.name.includes("Ceket"));
    if (i !== -1) list.splice(2, 0, list.splice(i, 1)[0]);

    return list;
}

// Sepet doğrulaması için: verilen id listesindeki ürünleri renk ve stoklarıyla getirir.
export async function getProductsByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: COLOR_INCLUDE,
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    category: p.category,
    active: p.active,
    colors: p.colors.map(toColor),
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
