import type { NextRequest } from "next/server";
import { handleMiddleware } from "./middleware/index";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export function middleware(request: NextRequest) {
  return handleMiddleware(request);
}
