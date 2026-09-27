"use client";

import { useEffect } from "react";
import { CART_KEY } from "@/lib/constants";

// Ödeme başarılı olunca tarayıcıda saklanan sepeti temizler.
export default function ClearCart() {
  useEffect(() => {
    try { localStorage.removeItem(CART_KEY); } catch {}
  }, []);
  return null;
}
