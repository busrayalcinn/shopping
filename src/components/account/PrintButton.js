"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 hover:bg-stone-700"
    >
      <Printer size={15} /> Yazdır / PDF indir
    </button>
  );
}
