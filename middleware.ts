import type { NextRequest } from "next/server";
import { handleMiddleware } from "./middleware/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/account/:path*", "/settings/:path*", "/api/private/:path*"],
};

export function middleware(request: NextRequest) {
  return handleMiddleware(request);
}
