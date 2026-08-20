import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/workplaces",
  "/income",
  "/friends",
  "/profile",
  "/messages",
  "/groups",
];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isProtected = PROTECTED_PREFIXES.some((p) => req.nextUrl.pathname.startsWith(p));

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/workplaces/:path*",
    "/income/:path*",
    "/friends/:path*",
    "/profile/:path*",
    "/messages/:path*",
    "/groups/:path*",
  ],
};
