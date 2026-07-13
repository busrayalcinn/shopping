import { NextResponse } from "next/server";
import { getProducts } from "@/lib/db";

// Ürünler veritabanından her istekte okunur (build'de dondurulmaz).
export const dynamic = "force-dynamic";

// GET /api/products -> tüm ürünler (veritabanından)
export async function GET() {
  return NextResponse.json(getProducts());
}
