import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createReturnRequest, getReturnableQuantities, OrderError } from "@/lib/orders";

// GET /api/orders/:id/returns -> her kalem için iade edilebilir adet
export async function GET(req, { params }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findFirst({ where: { id: Number(id), userId: user.id } });
  if (!order) return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });

  return NextResponse.json({ items: await getReturnableQuantities(order.id) });
}

// POST /api/orders/:id/returns   Body: { items: [{ orderItemId, qty }], reason, note? }
export async function POST(req, { params }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  try {
    const ret = await createReturnRequest({
      userId: user.id,
      orderId: Number(id),
      items: body.items,
      reason: body.reason,
      note: typeof body.note === "string" ? body.note : "",
    });
    return NextResponse.json({ ok: true, id: ret.id });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
