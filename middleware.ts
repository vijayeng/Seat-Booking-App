import type { NextRequest } from "next/server";
import { handleMiddleware } from "./middleware/auth";

export const config = {
  matcher: [
    "/api/auth/login",
    "/api/auth/signup",
    "/dashboard/:path*",
    "/payment/:path*",
    "/account/:path*",
    "/settings/:path*",
    "/api/private/:path*",
    "/api/seats/:path*",
    "/api/payment/:path*",
  ],
};

export function middleware(request: NextRequest) {
  return handleMiddleware(request);
}
