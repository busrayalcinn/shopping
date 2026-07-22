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
// ORDER
// =========================

export async function createOrder({ userId, total }) {
  return prisma.order.create({
    data: {
      userId,
      total,
      status: "pending",
    },
  });
}

const PRODUCTS = [
  {
    id: 1,
    name: "Oversize Keten Gömlek",
    price: 540,
    cat: "Üst Giyim",
    swatch: "bg-stone-300",
    text: "text-stone-800",
  },
  {
    id: 2,
    name: "Yüksek Bel Pantolon",
    price: 720,
    cat: "Alt Giyim",
    swatch: "bg-stone-800",
    text: "text-stone-100",
  },
  {
    id: 3,
    name: "Yün Karışımlı Kazak",
    price: 890,
    cat: "Üst Giyim",
    swatch: "bg-amber-200",
    text: "text-stone-800",
  },
  {
    id: 4,
    name: "Pamuklu Basic Tişört",
    price: 260,
    cat: "Üst Giyim",
    swatch: "bg-stone-100",
    text: "text-stone-800",
  },
  {
    id: 5,
    name: "Geniş Paça Jean",
    price: 980,
    cat: "Alt Giyim",
    swatch: "bg-indigo-300",
    text: "text-stone-900",
  },
  {
    id: 6,
    name: "Uzun Trençkot",
    price: 1850,
    cat: "Dış Giyim",
    swatch: "bg-stone-400",
    text: "text-stone-900",
  },
  {
    id: 7,
    name: "Triko Hırka",
    price: 650,
    cat: "Üst Giyim",
    swatch: "bg-rose-200",
    text: "text-stone-800",
  },
  {
    id: 8,
    name: "Pileli Midi Etek",
    price: 580,
    cat: "Alt Giyim",
    swatch: "bg-emerald-200",
    text: "text-stone-800",
  },
];

export function getProducts() {
  return PRODUCTS;
}