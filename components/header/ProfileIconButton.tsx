"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";

function initials(name?: string | null, email?: string | null) {
  const src = (name || "").trim() || (email || "").trim();
  if (!src) return "U";
  const parts = src.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "U";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

export default function ProfileMenu({
  pillClass = "",
  activeGlowClass = "",
  subtleGlowClass = "",
}: {
  pillClass?: string;
  activeGlowClass?: string;
  subtleGlowClass?: string;
}) {
  const { data: session, status } = useSession();
  const authed = status === "authenticated";

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const init = useMemo(
    () => initials((session?.user as any)?.name, session?.user?.email),
    [session]
  );

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (open && rootRef.current && !rootRef.current.contains(t)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  // Reuse your Header pill feel, but make it round + icon-sized
  const triggerClass =
    (pillClass || "") +
    " relative shrink-0 h-10 w-10 px-0 rounded-full " +
    (open ? ` ${activeGlowClass}` : "");

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={authed ? "Account menu" : "Sign in"}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={triggerClass}
      >
        {/* gold ring */}
        <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-[#F5D77A]/25 group-hover:ring-[#F5D77A]/35" />

        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-black/40">
          {authed ? (
            <span className="text-xs font-semibold tracking-wide text-[#F5D77A]">
              {init}
            </span>
          ) : (
            // simple user glyph (no extra deps)
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              className="text-white/75 group-hover:text-white"
              aria-hidden="true"
            >
              <path
                d="M20 21a8 8 0 1 0-16 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="
            absolute right-0 top-full mt-2 w-56 rounded-2xl p-2 z-[80]
            backdrop-blur-md
            bg-gradient-to-r from-[rgba(212,175,55,0.30)] via-[rgba(180,140,40,0.30)] to-[rgba(212,175,55,0.30)]
            border border-[#d4af37]
            shadow-[inset_0_1px_6px_rgba(255,255,255,0.08),0_10px_30px_rgba(0,0,0,0.35)]
          "
        >
          <div className="px-3 py-2">
            <div className="text-xs text-white/60">Signed in as</div>
            <div className="mt-0.5 text-sm text-white/90 truncate">
              {session?.user?.email ?? "—"}
            </div>
          </div>

          <div className="my-2 h-px bg-gradient-to-r from-transparent via-[rgba(212,175,55,0.45)] to-transparent" />

          {authed ? (
            <>
              <Link
                href="/account"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="
                  block rounded-xl px-3 py-2 text-sm
                  bg-black/25 hover:bg-black/40
                  hover:shadow-[0_0_16px_rgba(212,175,55,0.25)]
                  transition
                "
              >
                <span className="text-[#F5D77A]">Account</span>
              </Link>

              <Link
                href="/account/orders"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="
                  mt-1 block rounded-xl px-3 py-2 text-sm
                  bg-black/25 hover:bg-black/40
                  hover:shadow-[0_0_16px_rgba(212,175,55,0.25)]
                  transition
                "
              >
                <span className="text-[#F5D77A]">Orders</span>
              </Link>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="
                  mt-2 w-full rounded-xl px-3 py-2 text-left text-sm
                  bg-black/25 hover:bg-black/40
                  hover:shadow-[0_0_16px_rgba(212,175,55,0.25)]
                  transition
                "
              >
                <span className="text-white/85">Sign out</span>
              </button>
            </>
          ) : (
            <Link
              href="/sign-in"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="
                block rounded-xl px-3 py-2 text-sm
                bg-black/25 hover:bg-black/40
                hover:shadow-[0_0_16px_rgba(212,175,55,0.25)]
                transition
              "
            >
              <span className="text-[#F5D77A]">Sign in</span>
            </Link>
          )}

          <div className="mt-2 h-px bg-gradient-to-r from-transparent via-[rgba(212,175,55,0.35)] to-transparent" />

          <div className="px-3 py-2 text-[11px] text-white/50">
            Private by default.
          </div>
        </div>
      )}
    </div>
  );
}
