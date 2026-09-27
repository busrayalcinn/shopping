import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminGuard";
import { parseProductInput } from "@/lib/productInput";

// PUT /api/admin/products/:id  — ürün bilgisi + beden stokları
export async function PUT(req, { params }) {
  const { deny } = await requireAdmin();
  if (deny) return deny;

  const { id } = await params;
  const productId = Number(id);
  const body = await req.json().catch(() => ({}));
  const { data, stock, error } = parseProductInput(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const product = await prisma.$transaction(async (tx) => {
    const p = await tx.product.update({ where: { id: productId }, data });
    for (const [size, n] of Object.entries(stock)) {
      await tx.productVariant.upsert({
        where: { productId_size: { productId, size } },
        update: { stock: n },
        create: { productId, size, stock: n },
      });
    }
    return p;
  });

  return NextResponse.json({ ok: true, product });
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
