import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminGuard";
import { parseProductInput, saveColors, productErrorResponse } from "@/lib/productInput";

// PUT /api/admin/products/:id  — ürün bilgisi + renkler + renk/beden stokları
export async function PUT(req, { params }) {
  const { deny } = await requireAdmin();
  if (deny) return deny;

  const { id } = await params;
  const productId = Number(id);
  const body = await req.json().catch(() => ({}));
  const { data, colors, error } = parseProductInput(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({ where: { id: productId }, data });
      await saveColors(tx, productId, colors);
      return p;
    });
    return NextResponse.json({ ok: true, product });
  } catch (e) {
    const r = productErrorResponse(e);
    if (r) return NextResponse.json({ error: r.error }, { status: r.status });
    throw e;
  }
}

// DELETE /api/admin/products/:id
// Ürün silinmez, satıştan kaldırılır: geçmiş siparişler, iadeler ve faturalar
// bu ürüne referans vermeye devam eder. Tekrar satışa almak için PUT { active: true }.
export async function DELETE(req, { params }) {
  const { deny } = await requireAdmin();
  if (deny) return deny;

  const { id } = await params;
  await prisma.product.update({ where: { id: Number(id) }, data: { active: false } });

  return NextResponse.json({ ok: true });
}
