"use client";

import { useState } from "react";
import Image from "next/image";

// Ürün sayfasındaki büyük görsel + renk seçimi
export default function ProductGallery({ name, colors }) {
  const [active, setActive] = useState(colors.find((c) => !c.soldOut) || colors[0]);

  return (
    <div>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl" style={{ background: active.hex }}>
        {active.imageUrl ? (
          <Image
            key={active.imageUrl}
            src={active.imageUrl}
            alt={`${name} — ${active.name}`}
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-x-0 bottom-8 text-center text-sm text-stone-700/80">{active.name} · Fotoğraf yakında</span>
        )}
      </div>

      {colors.length > 1 && (
        <div className="mt-4">
          <p className="mb-2 text-sm"><span className="text-stone-500">Renk:</span> {active.name}{active.soldOut && <span className="ml-2 text-xs text-stone-400">(tükendi)</span>}</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Renk seç">
            {colors.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={active.id === c.id}
                aria-label={`${c.name}${c.soldOut ? " (tükendi)" : ""}`}
                title={c.name}
                onClick={() => setActive(c)}
                className={`h-8 w-8 rounded-full border ${active.id === c.id ? "border-stone-900 ring-2 ring-stone-900 ring-offset-2" : "border-stone-300 hover:border-stone-600"}`}
                style={{ background: c.hex }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
