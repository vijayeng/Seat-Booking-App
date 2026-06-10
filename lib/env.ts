import type { EnvironmentVariables } from "@/types/env";

const requiredServerEnv = ["DATABASE_URL", "JWT_SECRET"] as const;
const requiredPublicEnv = ["NEXT_PUBLIC_APP_NAME", "NEXT_PUBLIC_APP_URL"] as const;

export function getEnv(): EnvironmentVariables {
  return {
    DATABASE_URL: process.env.DATABASE_URL ?? "",
    JWT_SECRET: process.env.JWT_SECRET ?? "",
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? "Seat Booking App",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    NODE_ENV: process.env.NODE_ENV as EnvironmentVariables["NODE_ENV"],
  };
}

export function validateEnv() {
  const missingKeys = [...requiredServerEnv, ...requiredPublicEnv].filter(
    (key) => !process.env[key],
  );

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingKeys.join(", ")}`,
    );
  }
}
