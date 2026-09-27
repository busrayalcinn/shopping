import { NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/adminGuard";
import { advanceOrder, cancelOrder, retryCancelRefund } from "@/lib/orders";
import { CARRIERS } from "@/lib/orderStatus";

// PATCH /api/admin/orders/:id
// Body: { action: "prepare" | "ship" | "deliver" | "cancel" | "retry-refund", carrier?, trackingNumber?, reason? }
export async function PATCH(req, { params }) {
  const { deny } = await requireAdmin();
  if (deny) return deny;

  const { id } = await params;
  const orderId = Number(id);
  const body = await req.json().catch(() => ({}));

  try {
    switch (body.action) {
      case "prepare":
      case "deliver":
        await advanceOrder({ orderId, action: body.action });
        return NextResponse.json({ ok: true });
      case "ship":
        if (!CARRIERS.includes(body.carrier)) return NextResponse.json({ error: "Kargo firması seç." }, { status: 400 });
        await advanceOrder({ orderId, action: "ship", carrier: body.carrier, trackingNumber: String(body.trackingNumber || "") });
        return NextResponse.json({ ok: true });
      case "cancel":
        return NextResponse.json({ ok: true, ...(await cancelOrder({ orderId, byAdmin: true, reason: String(body.reason || "") })) });
      case "retry-refund":
        return NextResponse.json({ ok: true, ...(await retryCancelRefund(orderId)) });
      default:
        return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
    }
  } catch (e) {
    return errorResponse(e);
  }
}
