// components/header/HeaderTunerPanel.tsx
"use client";

import React from "react";
import type { HeaderTuner } from "./useHeaderLayoutTuner";

function Row({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/35 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-wide text-white/70">{label}</div>
        <div className="text-xs text-white/60 tabular-nums">
          {value}px
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[#F5D77A]"
      />

      {hint ? <div className="mt-1 text-[11px] text-white/45">{hint}</div> : null}
    </div>
  );
}

export default function HeaderTunerPanel({
  open,
  onClose,
  tuner,
  onPatch,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  tuner: HeaderTuner;
  onPatch: (patch: Partial<HeaderTuner>) => void;
  onReset: () => void;
}) {
  if (!open) return null;

  return (
    <div className="absolute right-0 top-full mt-2 z-[80] w-[min(92vw,420px)]">
      <div
        className="
          rounded-2xl border border-white/10
          bg-black/80 backdrop-blur
          shadow-[0_20px_80px_rgba(0,0,0,0.55)]
          overflow-hidden
        "
        role="dialog"
        aria-label="Header layout tuner"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10">
          <div>
            <div className="text-sm font-semibold text-white">Header Layout Tuner</div>
            <div className="text-xs text-white/55">
              Adjust spacing live (saved to this browser).
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Row
              label="Search X"
              value={tuner.searchX}
              min={-200}
              max={200}
              onChange={(v) => onPatch({ searchX: v })}
              hint="Left/right nudge"
            />
            <Row
              label="Search Y"
              value={tuner.searchY}
              min={-24}
              max={24}
              onChange={(v) => onPatch({ searchY: v })}
              hint="Up/down nudge"
            />

            <Row
              label="Profile X"
              value={tuner.profileX}
              min={-200}
              max={200}
              onChange={(v) => onPatch({ profileX: v })}
              hint="Left/right nudge"
            />
            <Row
              label="Profile Y"
              value={tuner.profileY}
              min={-24}
              max={24}
              onChange={(v) => onPatch({ profileY: v })}
              hint="Up/down nudge"
            />
          </div>

          <Row
            label="Search width"
            value={tuner.searchWidth}
            min={240}
            max={520}
            onChange={(v) => onPatch({ searchWidth: v })}
            hint="Make search wider/narrower"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Row
              label="Center gap"
              value={tuner.centerGap}
              min={6}
              max={28}
              onChange={(v) => onPatch({ centerGap: v })}
              hint="Gap between nav + search"
            />
            <Row
              label="Right cluster gap"
              value={tuner.rightGap}
              min={4}
              max={20}
              onChange={(v) => onPatch({ rightGap: v })}
              hint="Gap between profile + cart"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={onReset}
              className="
                rounded-xl border border-white/10 bg-white/5
                px-4 py-2 text-sm text-white/80 hover:bg-white/10
              "
            >
              Reset defaults
            </button>

            <div className="text-[11px] text-white/45">
              Tip: keep Y small for a clean header line.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
