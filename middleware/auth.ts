import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { verifyAuthTokenEdge } from "@/lib/auth-edge";

const PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/account",
  "/settings",
  "/api/private",
  "/api/seats",
  "/api/payment",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isApiRoute(pathname: string) {
  return pathname.startsWith("/api/");
}

export async function handleMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return unauthorizedResponse(request, pathname);
  }

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is required to verify auth tokens.");
    }

    await verifyAuthTokenEdge(token, secret);
    return NextResponse.next();
  } catch {
    return unauthorizedResponse(request, pathname);
  }
}

function unauthorizedResponse(request: NextRequest, pathname: string) {
  if (isApiRoute(pathname)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const redirectUrl = new URL("/", request.url);
  redirectUrl.searchParams.set("auth", "required");
  return NextResponse.redirect(redirectUrl);
}
