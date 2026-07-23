import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/admin/products
export async function GET() {
  const user = await getSessionUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "Yetkisiz" },
      { status: 401 }
    );
  }

  const products = await prisma.product.findMany({
    orderBy: { id: "desc" },
  });

  return NextResponse.json(products);
}

// POST /api/admin/products
export async function POST(req) {
  const user = await getSessionUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "Yetkisiz" },
      { status: 401 }
    );
  }

  const body = await req.json();

  const product = await prisma.product.create({
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