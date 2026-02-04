"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-white/90 hover:bg-black/55"
    >
      Sign out
    </button>
  );
}
