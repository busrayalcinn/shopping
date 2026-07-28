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

  if (!user) return null;

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

export async function getProducts() {
  const products = await prisma.product.findMany({
    orderBy: { id: "asc" },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    cat: p.category,
    swatch: p.swatch,
    text: p.textColor,
    imageUrl: p.imageUrl,
  }));
}

// Sepet doğrulaması için: verilen id listesindeki ürünleri getirir.
export async function getProductsByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
  }));
}

export async function getUserByGoogleId(id) {
  return prisma.user.findUnique({
    where: {
      googleId: id,
    },
  });
}

// =========================
// ORDER
// =========================

// lines: [{ productId, name, price, size, qty, lineTotal }] (bkz. src/lib/cart.js)
export async function createOrder({ userId, name, address, total, lines }) {
  return prisma.order.create({
    data: {
      userId,
      customerName: name,
      address,
      total,
      status: "pending",
      items: {
        create: lines.map((l) => ({
          productId: l.productId,
          name: l.name,
          price: l.price,
          size: l.size,
          qty: l.qty,
          lineTotal: l.lineTotal,
        })),
      },
    },
  });
}

export async function attachStripeSession(orderId, stripeSessionId) {
  return prisma.order.update({
    where: { id: orderId },
    data: { stripeSessionId },
  });
}

// Stripe webhook / success sayfası: session ödendiğinde siparişi 'paid' işaretler.
export async function markOrderPaidBySession(stripeSessionId) {
  const order = await prisma.order.findUnique({
    where: { stripeSessionId },
  });

  if (!order) return null;
  if (order.status === "paid") return order;

  return prisma.order.update({
    where: { stripeSessionId },
    data: { status: "paid" },
  });
}

export async function getOrderByStripeSession(stripeSessionId, userId) {
  return prisma.order.findFirst({
    where: { stripeSessionId, userId },
  });
}

// Sipariş + kalemleri getirir; /order/success sayfasının beklediği şekle dönüştürür.
export async function getOrderWithItems(orderId, userId) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true },
  });

  if (!order) return null;

  return {
    id: order.id,
    total: order.total,
    paymentStatus: order.status,
    items: order.items.map((it) => ({
      name: it.name,
      size: it.size,
      qty: it.qty,
      lineTotal: it.lineTotal,
    })),
  };
}

export async function getOrdersForUser(userId) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return orders.map((o) => ({
    id: o.id,
    total: o.total,
    status: o.status,
    createdAt: o.createdAt,
    items: o.items.map((it) => ({
      name: it.name,
      size: it.size,
      qty: it.qty,
      lineTotal: it.lineTotal,
    })),
  }));
}