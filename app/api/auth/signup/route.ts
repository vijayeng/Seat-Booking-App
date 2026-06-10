import { hash } from "bcryptjs";
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
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json(
      {
        error: "An account with this email already exists.",
      },
      { status: 409 },
    );
  }

  const passwordHash = await hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });

  const token = await signAuthToken({ userId: user.id });
  const response = NextResponse.json<AuthResponseBody>(
    {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );

  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

  return response;
}
