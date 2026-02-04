"use client";

import { useEffect } from "react";
import { readCompare } from "./compare";

export default function ShopCompareToggle() {
  useEffect(() => {
    // Keep compare state in sync for other listeners (bottom bar, compare page, etc.)
    const sync = () => {
      readCompare();
    };

    sync();

    const onStorage = () => sync();
    window.addEventListener("storage", onStorage);
    window.addEventListener("leaflyx-compare", onStorage as any);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("leaflyx-compare", onStorage as any);
    };
  }, []);

  // 🔒 Intentionally render nothing
  return null;
}
