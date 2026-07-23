import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Ürün güncelle
export async function PUT(req, { params }) {
  const user = await getSessionUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const body = await req.json();

  const product = await prisma.product.update({
    where: { id: Number(params.id) },
    data: {
      name: body.name,
      price: Number(body.price),
      category: body.category,
      swatch: body.swatch,
      textColor: body.textColor,
      imageUrl: body.imageUrl,
    },
  });

  return NextResponse.json({ ok: true, product });
}

// Ürün sil
export async function DELETE(req, { params }) {
  const user = await getSessionUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  await prisma.product.delete({
    where: { id: Number(params.id) },
  });

  return NextResponse.json({ ok: true });
}