import { NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/adminGuard";
import { updateReturn } from "@/lib/orders";

// PATCH /api/admin/returns/:id   Body: { action: "approve" | "reject" | "refund", adminNote?, restock? }
export async function PATCH(req, { params }) {
  const { deny } = await requireAdmin();
  if (deny) return deny;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  try {
    await updateReturn({
      returnId: Number(id),
      action: body.action,
      adminNote: typeof body.adminNote === "string" ? body.adminNote : "",
      restockItems: body.restock !== false,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
