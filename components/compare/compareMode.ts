// components/compare/compareMode.ts
"use client";

const KEY = "leaflyx_compare_mode_v1";

export function readCompareMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function writeCompareMode(on: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, on ? "1" : "0");
    // notify same-tab listeners
    window.dispatchEvent(new Event("leaflyx-compare-mode"));
  } catch {
    // ignore
  }
}

export function toggleCompareMode(): boolean {
  const next = !readCompareMode();
  writeCompareMode(next);
  return next;
}
