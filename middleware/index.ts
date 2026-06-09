import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function handleMiddleware(request: NextRequest) {
  void request;
  return NextResponse.next();
}
