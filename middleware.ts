import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;

    const res = NextResponse.next();

    // SEO hard-block
    if (pathname.startsWith("/account") || pathname.startsWith("/admin")) {
      res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    }

    // Admin role lock
    if (pathname.startsWith("/admin")) {
      const role = req.nextauth.token?.role;
      if (role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return res;
  },
  {
    pages: {
      signIn: "/sign-in",
      error: "/sign-in",
    },
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
