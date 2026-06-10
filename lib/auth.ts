import { jwtVerify, SignJWT } from "jose";

export const AUTH_COOKIE_NAME = "seat-booking-token";
export const AUTH_TOKEN_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 90;
const JWT_ALGORITHM = "HS256";

export type AuthTokenPayload = {
  userId: string;
};

function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is required to sign and verify auth tokens.");
  }

  return new TextEncoder().encode(secret);
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: AUTH_TOKEN_EXPIRES_IN_SECONDS,
  };
}

export async function signAuthToken(payload: AuthTokenPayload) {
  return new SignJWT({})
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(getJwtSecretKey());
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecretKey(), {
    algorithms: [JWT_ALGORITHM],
  });

  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new Error("Invalid authentication token.");
  }

  return {
    userId: payload.sub,
  };
}
