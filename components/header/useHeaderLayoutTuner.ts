// components/header/useHeaderLayoutTuner.ts
"use client";

import { useEffect, useMemo, useState } from "react";

export type HeaderTuner = {
  // Search positioning (px)
  searchX: number;
  searchY: number;

  // Profile positioning (px)
  profileX: number;
  profileY: number;

  // Layout knobs
  searchWidth: number; // px
  centerGap: number; // px gap between nav and search
  rightGap: number; // px gap between profile and cart
};

const STORAGE_KEY = "leaflyx:headerTuner:v1";

const DEFAULTS: HeaderTuner = {
  searchX: 0,
  searchY: 0,
  profileX: 0,
  profileY: 0,
  searchWidth: 340, // matches your current max-w-ish
  centerGap: 12,
  rightGap: 8,
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function useHeaderLayoutTuner() {
  const [tuner, setTuner] = useState<HeaderTuner>(DEFAULTS);
  const [ready, setReady] = useState(false);

  // Load once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<HeaderTuner>;
        setTuner({ ...DEFAULTS, ...parsed });
      } else {
        setTuner(DEFAULTS);
      }
    } catch {
      setTuner(DEFAULTS);
    } finally {
      setReady(true);
    }
  }, []);

  // Persist
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tuner));
    } catch {
      // ignore
    }
  }, [tuner, ready]);

  const api = useMemo(() => {
    return {
      ready,
      tuner,
      set: (patch: Partial<HeaderTuner>) => {
        setTuner((prev) => ({ ...prev, ...patch }));
      },
      reset: () => setTuner(DEFAULTS),
      // Guard rails so you can’t break layout too hard
      clampPatch: (patch: Partial<HeaderTuner>) => {
        const next: Partial<HeaderTuner> = { ...patch };

        if (typeof next.searchX === "number") next.searchX = clamp(next.searchX, -200, 200);
        if (typeof next.searchY === "number") next.searchY = clamp(next.searchY, -24, 24);

        if (typeof next.profileX === "number") next.profileX = clamp(next.profileX, -200, 200);
        if (typeof next.profileY === "number") next.profileY = clamp(next.profileY, -24, 24);

        if (typeof next.searchWidth === "number") next.searchWidth = clamp(next.searchWidth, 240, 520);

        if (typeof next.centerGap === "number") next.centerGap = clamp(next.centerGap, 6, 28);
        if (typeof next.rightGap === "number") next.rightGap = clamp(next.rightGap, 4, 20);

        setTuner((prev) => ({ ...prev, ...next }));
      },
    };
  }, [tuner, ready]);

  return api;
}
