import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Require auth for dashboard, cart, checkout
  const needsAuth =
    pathname.startsWith("/dashboard") ||
    pathname === "/cart" ||
    pathname.startsWith("/checkout");

  if (!needsAuth) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const url = new URL("/auth/signin", req.url);
    // 👇 send them back to the page they wanted after sign-in
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }

  // Role gating for dashboard sections
  if (pathname.startsWith("/dashboard/admin") && token.role !== "ADMIN")
    return NextResponse.redirect(new URL("/", req.url));

  if (pathname.startsWith("/dashboard/vendor") && token.role !== "VENDOR")
    return NextResponse.redirect(new URL("/", req.url));

  if (pathname.startsWith("/dashboard/buyer") && token.role !== "BUYER")
    return NextResponse.redirect(new URL("/", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/cart",
    "/checkout/:path*",
  ],
};
