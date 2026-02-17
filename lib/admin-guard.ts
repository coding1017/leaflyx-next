// lib/admin-guard.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { unstable_noStore as noStore } from "next/cache";

/**
 * Admin gate (session-only).
 * Allows access ONLY if the signed-in user has role === "ADMIN".
 *
 * Use in any admin API route:
 *   await assertAdmin();
 */
export async function assertAdmin() {
  // ✅ Prevent any caching of admin-protected logic
  noStore();

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  const role = (session.user as any)?.role;
  if (role !== "ADMIN") throw new Error("FORBIDDEN");

  return true;
}
