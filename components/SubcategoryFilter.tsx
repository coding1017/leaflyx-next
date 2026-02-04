"use client";

import { useState } from "react";

export default function SubcategoryFilter({
  options,
  active,
  onChange,
}: {
  options: string[];
  active: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(option: string) {
    if (active.includes(option)) {
      onChange(active.filter((o) => o !== option));
    } else {
      onChange([...active, option]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => toggle(opt)}
          className={`px-3 py-1 rounded-full text-sm border ${
            active.includes(opt)
              ? "bg-[var(--brand-green)] text-white border-transparent"
              : "border-gray-300 hover:border-[var(--brand-gold)]"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
