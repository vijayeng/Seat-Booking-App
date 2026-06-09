export interface EnvironmentVariables {
  DATABASE_URL: string;
  NEXT_PUBLIC_APP_NAME: string;
  NEXT_PUBLIC_APP_URL: string;
  NODE_ENV?: "development" | "test" | "production";
}
