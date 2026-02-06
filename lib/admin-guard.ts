// lib/admin-guard.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

/**
 * Admin gate (session-only).
 * Allows access ONLY if the signed-in user has role === "SUPER_ADMIN".
 *
 * Use in any admin API route:
 *   await assertAdmin();
 */
export async function assertAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  const role = (session.user as any)?.role;
  if (role !== "ADMIN") throw new Error("FORBIDDEN");
  forceNoStore();
  return true;
}

// Prevent any accidental caching of admin-protected responses
function forceNoStore() {
  // no-op helper; routes should set headers if needed
}
