import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

export async function getAuthenticatedUserFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifyAuthToken(token);
  } catch {
    return null;
  }
}
