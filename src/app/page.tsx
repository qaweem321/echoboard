import { getSessionCookie } from "better-auth/cookies";
import { headers } from "next/headers";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { PlanCard } from "@/components/plan-card";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { billingEnabled, plans } from "@/lib/billing/plans";

const features = [
  {
    title: "Feedback boards",
    description: "One place for feature requests and bugs, sorted by what customers want most.",
  },
  {
    title: "Voting without sign-up",
    description: "Customers vote in one click, so you hear from far more of them.",
  },
  {
    title: "Public roadmap",
    description: "Show what's planned, in progress and done, and let people vote on it.",
  },
  {
    title: "Changelog and updates",
    description: "Announce what shipped and email everyone who asked for it, automatically.",
  },
  {
    title: "Widget for your app",
    description: "One line of code adds a feedback button to your website or product.",
  },
  {
    title: "Your brand, your domain",
    description: "Your logo and colors, on feedback.yourcompany.com, with Slack and webhooks.",
  },
];

export default async function HomePage() {
  // Only checks that a login cookie exists (no database call), to keep this page fast.
  // If the session has expired, /dashboard sends the visitor to the login page.
  const loggedIn = getSessionCookie(await headers()) !== null;
  const startHref = loggedIn ? "/dashboard" : "/signup";
  // Self-hosted installs without billing have no plans to show.
  const showPricing = billingEnabled();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <nav className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            {showPricing && (
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">
                Pricing
              </a>
            )}
            {loggedIn ? (
              <ButtonLink href="/dashboard">Go to dashboard</ButtonLink>
            ) : (
              <>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                  Log in
                </Link>
                <ButtonLink href="/signup">Get started</ButtonLink>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Build what your customers actually want
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Collect feedback, let customers vote, share your roadmap and tell everyone when their
            idea ships.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <ButtonLink href={startHref} size="lg">
              {loggedIn ? "Go to dashboard" : "Start free"}
            </ButtonLink>
            <a href="#features" className={buttonClasses({ variant: "outline", size: "lg" })}>
              See features
            </a>
          </div>
        </section>

        <section id="features" className="bg-surface py-20">
          <h2 className="sr-only">Features</h2>
          <div className="mx-auto max-w-6xl px-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-background p-6 rounded-xl border border-border"
              >
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {showPricing && (
          <section id="pricing" className="py-20">
            <div className="mx-auto max-w-4xl px-6">
              <h2 className="text-3xl font-bold tracking-tight text-center">Simple pricing</h2>
              <p className="mt-3 text-center text-muted-foreground">
                Start free. Upgrade any time from your workspace&apos;s Billing page.
              </p>
              <div className="mt-12 grid gap-8 sm:grid-cols-2">
                {Object.entries(plans).map(([id, plan]) => (
                  <PlanCard key={id} plan={plan} highlighted={id === "pro"}>
                    <ButtonLink href={startHref} variant={id === "pro" ? "primary" : "outline"}>
                      {id === "pro" ? "Start with Pro" : "Start free"}
                    </ButtonLink>
                  </PlanCard>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border py-6 text-sm text-subtle-foreground">
        <div className="mx-auto max-w-6xl px-6 flex flex-wrap items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}
          </p>
          <nav aria-label="Legal" className="flex gap-6">
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
