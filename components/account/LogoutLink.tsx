// components/account/LogoutLink.tsx
"use client";

import { signOut } from "next-auth/react";

export default function LogoutLink() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="
        group relative inline-flex items-center gap-2
        rounded-xl px-4 py-2 text-sm font-medium
        text-[#F5D77A]
        bg-black/40 border border-[#F5D77A]/30
        hover:bg-black/60
        hover:shadow-[0_0_18px_rgba(245,215,122,0.25)]
        transition
      "
    >
      <span className="text-[#F5D77A]/70">Not you?</span>
      <span className="underline underline-offset-4 group-hover:opacity-90">
        Logout
      </span>
    </button>
  );
}
