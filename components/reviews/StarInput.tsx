"use client";
import { useState } from "react";
import { Star } from "lucide-react";

export default function StarInput({
  value, onChange,
}: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value;
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onChange(n)}
          aria-label={`${n} star`}
        >
          <Star
            className={n <= active ? "fill-current" : ""}
            style={{ color: "var(--brand-gold)" }}
          />
        </button>
      ))}
    </div>
  );
}
