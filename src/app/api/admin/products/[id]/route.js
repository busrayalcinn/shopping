import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// DELETE /api/admin/products/:id
export async function DELETE(req, { params }) {
  const user = await getSessionUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "Yetkisiz" },
      { status: 401 }
    );
  }

  await prisma.product.delete({
    where: {
      id: Number(params.id),
    },
  });

  return NextResponse.json({ ok: true });
}