import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminGuard";
import { parseProductInput } from "@/lib/productInput";

// GET /api/admin/products  (satıştan kaldırılanlar dahil, stoklarla birlikte)
export async function GET() {
  const { deny } = await requireAdmin();
  if (deny) return deny;

  const products = await prisma.product.findMany({
    orderBy: { id: "desc" },
    include: { variants: true },
  });

  return NextResponse.json(
    products.map(({ variants, ...p }) => ({
      ...p,
      stock: Object.fromEntries(variants.map((v) => [v.size, v.stock])),
    }))
  );
}

// POST /api/admin/products
export async function POST(req) {
  const { deny } = await requireAdmin();
  if (deny) return deny;

  const body = await req.json().catch(() => ({}));
  const { data, stock, error } = parseProductInput(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const product = await prisma.product.create({
    data: {
      ...data,
      variants: { create: Object.entries(stock).map(([size, n]) => ({ size, stock: n })) },
    },
  });

  return NextResponse.json({ ok: true, product });
}
