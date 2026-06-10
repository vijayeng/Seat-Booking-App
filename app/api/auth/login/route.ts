import { compare } from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE_NAME, getAuthCookieOptions, signAuthToken } from "@/lib/auth";
import { validateAuthCredentials } from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";

type AuthResponseBody = {
  user: {
    id: string;
    email: string;
    createdAt: string;
  };
};

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON body.",
      },
      { status: 400 },
    );
  }

  const validation = validateAuthCredentials(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        fields: validation.errors,
      },
      { status: 400 },
    );
  }

  const { email, password } = validation.data;
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      createdAt: true,
      passwordHash: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        error: "Invalid email or password.",
      },
      { status: 401 },
    );
  }

  const isPasswordValid = await compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return NextResponse.json(
      {
        error: "Invalid email or password.",
      },
      { status: 401 },
    );
  }

  const token = await signAuthToken({ userId: user.id });
  const response = NextResponse.json<AuthResponseBody>(
    {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      },
    },
    { status: 200 },
  );

  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

  return response;
}
