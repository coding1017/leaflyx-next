"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type Toast = {
  id: string;
  title: string;
  description?: string;
};

type ToastContextType = {
  pushToast: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setToasts((t) => [...t, { ...toast, id }]);

    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <ToastViewport toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

function ToastViewport({ toasts }: { toasts: Toast[] }) {
  return (
    <div
      className="
        fixed top-[88px] right-5
        z-[100]
        space-y-3
        pointer-events-none
      "
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="
            pointer-events-auto relative
            w-[340px] max-w-[calc(100vw-2.5rem)]
            rounded-2xl
            bg-black/80
            border border-[var(--brand-gold)]
            px-4 py-3
            backdrop-blur
            ring-1 ring-[var(--brand-gold)]/20
            shadow-[0_10px_30px_rgba(0,0,0,0.45)]
            hover:bg-black
            hover:shadow-[0_0_12px_rgba(212,175,55,0.45)]
            transition
          "
        >
          {/* subtle inner sheen */}
          <div
            aria-hidden
            className="
              absolute inset-0 rounded-2xl
              bg-[radial-gradient(120%_80%_at_30%_0%,rgba(255,255,255,0.06)_0%,rgba(0,0,0,0)_55%)]
              pointer-events-none
            "
          />

          {/* Title — SOLID GOLD */}
          <p className="text-sm font-semibold tracking-tight text-[var(--brand-gold)]">
            {t.title}
          </p>

          {/* Description — COA pill gradient */}
          {t.description && (
            <p
              className="
                mt-0.5 text-xs leading-snug
                bg-gradient-to-r from-yellow-300 to-emerald-300
                bg-clip-text text-transparent
              "
            >
              {t.description}
            </p>
          )}

          {/* gold hairline */}
          <div className="mt-2 h-px w-full bg-gradient-to-r from-transparent via-[var(--brand-gold)]/60 to-transparent" />
        </div>
      ))}
    </div>
  );
}
