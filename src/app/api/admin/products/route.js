import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminGuard";
import { parseProductInput, saveColors, productErrorResponse } from "@/lib/productInput";

const toStock = (variants) => Object.fromEntries(variants.map((v) => [v.size, v.stock]));

// GET /api/admin/products  (satıştan kaldırılanlar dahil, renk ve stoklarla birlikte)
export async function GET() {
  const { deny } = await requireAdmin();
  if (deny) return deny;

  const products = await prisma.product.findMany({
    orderBy: { id: "desc" },
    include: {
      colors: { orderBy: [{ position: "asc" }, { id: "asc" }], include: { variants: true } },
    },
  });

  return NextResponse.json(
    products.map(({ colors, ...p }) => ({
      ...p,
      colors: colors.map(({ variants, ...c }) => ({ ...c, stock: toStock(variants) })),
    }))
  );
}

// POST /api/admin/products
export async function POST(req) {
  const { deny } = await requireAdmin();
  if (deny) return deny;

  const body = await req.json().catch(() => ({}));
  const { data, colors, error } = parseProductInput(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({ data });
      await saveColors(tx, p.id, colors);
      return p;
    });
    revalidatePath("/", "layout"); // vitrin ve ürün sayfaları hemen güncellensin
    return NextResponse.json({ ok: true, product });
  } catch (e) {
    const r = productErrorResponse(e);
    if (r) return NextResponse.json({ error: r.error }, { status: r.status });
    throw e;
  }
}
