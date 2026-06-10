import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PaymentCheckout } from "@/components/payment-checkout";
import { getAuthenticatedUserFromCookies } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Payment",
};

export default async function PaymentPage() {
  const user = await getAuthenticatedUserFromCookies();

  if (!user) {
    redirect("/login");
  }

  return <PaymentCheckout />;
}
