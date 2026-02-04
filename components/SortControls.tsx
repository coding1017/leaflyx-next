// components/SortControls.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortKey =
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc"
  | "potency_asc"
  | "potency_desc";

const OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name_asc", label: "Alphabetical (A–Z)" },
  { value: "name_desc", label: "Alphabetical (Z–A)" },
  { value: "price_asc", label: "Price (Low → High)" },
  { value: "price_desc", label: "Price (High → Low)" },
  { value: "potency_asc", label: "Potency % (Low → High)" },
  { value: "potency_desc", label: "Potency % (High → Low)" },
];

export function SortControls() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const current = (sp.get("sort") as SortKey) || "name_asc";
  const [isPending, startTransition] = useTransition();

  function setSort(next: SortKey) {
    const nextParams = new URLSearchParams(sp.toString());
    nextParams.set("sort", next);
    startTransition(() =>
      router.replace(`${pathname}?${nextParams.toString()}`)
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-300">Sort by</span>

      <Select
        defaultValue={current}
        onValueChange={(v) => setSort(v as SortKey)}
        disabled={isPending}
      >
        <SelectTrigger
          className="
            h-9 rounded-full px-4 text-sm font-medium
            bg-gradient-to-r from-lime-300 to-green-500
            text-white shadow-md
            border border-[var(--brand-gold)]
            focus:ring-2 focus:ring-[var(--brand-gold)]
          "
        >
          <SelectValue />
        </SelectTrigger>

        <SelectContent
          className="
            rounded-xl border border-[var(--brand-gold)]
            bg-black/80 backdrop-blur-md text-sm
          "
        >
          {OPTIONS.map((o) => (
            <SelectItem
              key={o.value}
              value={o.value}
              className="cursor-pointer focus:bg-white/5"
            >
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
