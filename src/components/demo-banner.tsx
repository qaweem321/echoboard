import { headers } from "next/headers";
import { demoLogin, demoTestCard, isDemoMode } from "@/lib/demo";

// Tells demo visitors what doesn't work and how to test-pay, so nothing looks like a bug.
export async function DemoBanner() {
  // Not inside the feedback widget on other websites (browsers mark iframe requests).
  if (!isDemoMode() || (await headers()).get("sec-fetch-dest") === "iframe") {
    return null;
  }
  return (
    <p className="border-b border-border bg-muted px-4 py-2 text-center text-sm text-muted-foreground">
      <strong className="text-foreground">Live demo:</strong> log in as {demoLogin.email} with
      password {demoLogin.password} to see the sample workspace, or sign up with any address (emails
      are turned off). To try Pro, pay with test card {demoTestCard.number}, expiry{" "}
      {demoTestCard.expiry} and CVC {demoTestCard.cvc}. No real money is charged.
    </p>
  );
}
