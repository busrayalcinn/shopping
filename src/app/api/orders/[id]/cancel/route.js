import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { cancelOrder, OrderError } from "@/lib/orders";

// POST /api/orders/:id/cancel   Body: { reason? }
export async function POST(req, { params }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  try {
    const result = await cancelOrder({
      orderId: Number(id),
      userId: user.id,
      reason: typeof body.reason === "string" ? body.reason : "",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
