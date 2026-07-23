import { NextResponse } from "next/server";
import { getProducts } from "@/lib/db";

// Ürünler veritabanından her istekte okunur (build'de dondurulmaz).
export const dynamic = "force-dynamic";

// GET /api/products -> tüm ürünler (PostgreSQL'den)
export async function GET() {
  const products = await getProducts();

  return NextResponse.json(products);
}