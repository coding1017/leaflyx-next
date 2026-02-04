"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";

function isYYYYMMDD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function toDateInputValue(v: any): string {
  if (!v) return "";
  try {
    const d = v instanceof Date ? v : new Date(v);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function parseYYYYMMDD(v: string): Date | null {
  if (!isYYYYMMDD(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return isNaN(d.getTime()) ? null : d;
}

function toYYYYMMDD(d: Date) {
  // store as date-only string
  return d.toISOString().slice(0, 10);
}

export default function BirthdayPicker({
  value,
  onChange,
  disabled,
}: {
  value: string; // "" or YYYY-MM-DD
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const selectedDate = useMemo(() => parseYYYYMMDD(value), [value]);

  useEffect(() => {
    // Prefer native date picker on touch devices (mobile/tablet)
    const mq = window.matchMedia?.("(pointer: coarse)");
    setIsTouch(!!mq?.matches);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClickOutside(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }

    if (open) {
      window.addEventListener("keydown", onKey);
      window.addEventListener("mousedown", onClickOutside);
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClickOutside);
    };
  }, [open]);

  // Mobile: native input (best UX)
  if (isTouch) {
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(toDateInputValue(e.target.value))}
        disabled={disabled}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-lg text-white outline-none focus:border-[#F5D77A]/40 disabled:opacity-60"
      />
    );
  }

  // Desktop: custom popover
  return (
    <div ref={wrapRef} className="relative mt-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-left text-lg text-white outline-none transition hover:border-white/20 disabled:opacity-60"
      >
        {selectedDate ? (
          <span className="text-white">
            {format(selectedDate, "MMMM d, yyyy")}
          </span>
        ) : (
          <span className="text-white/40">Select your birthday</span>
        )}
        <div className="mt-1 text-xs text-white/45">Format: YYYY-MM-DD</div>
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-[340px] max-w-full rounded-2xl border border-white/10 bg-black/80 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur">
          {/* Header row */}
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-white/80">Pick a date</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white/70 hover:border-white/20"
            >
              Close
            </button>
          </div>

          <DayPicker
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={(d) => {
              if (!d) return;
              onChange(toYYYYMMDD(d));
              setOpen(false);
            }}
            captionLayout="dropdown"
            fromYear={1920}
            toYear={new Date().getFullYear()}
            showOutsideDays
            className="rdp-leaflyx"
            classNames={{
              months: "flex flex-col",
              month: "space-y-2",
              caption: "flex items-center justify-between px-1",
              caption_label: "text-white/80 text-sm font-medium",
              dropdowns: "flex items-center gap-2",
              dropdown: "rounded-lg border border-white/10 bg-black/40 text-white/80 text-sm px-2 py-1",
              nav: "flex items-center gap-2",
              nav_button:
                "rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-white/70 hover:border-white/20",
              table: "w-full border-collapse",
              head_row: "flex",
              head_cell: "w-10 text-center text-[11px] text-white/45",
              row: "flex w-full",
              cell: "w-10 h-10 text-center",
              day: "w-10 h-10 rounded-xl text-white/80 hover:bg-white/10",
              day_selected: "rdp-day_selected",
              day_today: "border border-[#F5D77A]/35",
              day_outside: "text-white/25",
            }}
          />

          <div className="mt-2 text-[11px] text-white/45">
            Tip: Use the month/year dropdowns for fast navigation.
          </div>
        </div>
      ) : null}
    </div>
  );
}
