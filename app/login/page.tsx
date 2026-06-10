import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { getAuthenticatedUserFromCookies } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Login",
};

export default async function LoginPage() {
  const user = await getAuthenticatedUserFromCookies();

  if (user) {
    redirect("/dashboard");
  }

  return <AuthForm mode="login" />;
}
