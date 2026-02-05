// lib/authOptions.ts
import { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import argon2 from "argon2";
import { z } from "zod";
import { rateLimit } from "@/lib/rateLimit";

/**
 * NextAuth "req" inside Credentials authorize() is NOT always a standard Request.
 * So we extract IP defensively from whatever header shape we get.
 */
function getIpFromAuthorizeReq(req: any) {
  try {
    const h = req?.headers;

    // Case A: Headers-like with get()
    const xf = typeof h?.get === "function" ? h.get("x-forwarded-for") : undefined;
    const xr = typeof h?.get === "function" ? h.get("x-real-ip") : undefined;

    // Case B: plain object
    const xf2 = xf ?? h?.["x-forwarded-for"];
    const xr2 = xr ?? h?.["x-real-ip"];

    const raw = (xf2 || xr2 || "").toString();
    const ip = raw.split(",")[0]?.trim();
    return ip || "local";
  } catch {
    return "local";
  }
}

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },

  providers: [
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials, req) {
        const parsed = credsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();
        const password = parsed.data.password;

        // ✅ Rate limit signin (per IP + email)
        const ip = getIpFromAuthorizeReq(req);
        const rl = rateLimit({
          key: `signin:${ip}:${email}`,
          limit: 15,
          windowMs: 15 * 60 * 1000,
        });
        if (!rl.ok) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const ok = await argon2.verify(user.passwordHash, password);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          handle: user.handle,
        } as any;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // On initial login
      if (user) {
        token.uid = (user as any).id;
      }

      // Keep role/handle fresh even if changed in Prisma later
      if (token.uid) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.uid as string },
          select: { role: true, handle: true },
        });
        token.role = dbUser?.role ?? "USER";
        token.handle = dbUser?.handle ?? null;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.uid;
        (session.user as any).role = token.role;
        (session.user as any).handle = token.handle;
      }
      return session;
    },
  },

  pages: { signIn: "/sign-in" },
  secret: process.env.NEXTAUTH_SECRET,
};
