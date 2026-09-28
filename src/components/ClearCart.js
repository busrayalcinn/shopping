"use client";

import { useEffect } from "react";
import { CART_KEY, PENDING_CHECKOUT_KEY } from "@/lib/constants";

// Ödeme başarılı olunca tarayıcıda saklanan sepeti temizler.
export default function ClearCart() {
  useEffect(() => {
    try { localStorage.removeItem(CART_KEY); } catch {}
    try { sessionStorage.removeItem(PENDING_CHECKOUT_KEY); } catch {}
  }, []);
  return null;
}
