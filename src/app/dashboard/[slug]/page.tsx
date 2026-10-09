import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { PaymentProblemNotice } from "@/components/payment-problem-notice";
import { db } from "@/db";
import { boards, memberships, posts } from "@/db/schema";
import { getOrganizationSubscription } from "@/lib/billing";
import { effectivePlan, hasPaymentProblem, plans } from "@/lib/billing/plans";
import { endSentence } from "@/lib/format";
import { can } from "@/lib/permissions";
import { requireMembership } from "@/lib/session";
import { GetStarted } from "./get-started";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { organization, role } = await requireMembership(slug);

  const [boardCount, postCount, memberCount, subscription] = await Promise.all([
    db.$count(boards, eq(boards.organizationId, organization.id)),
    db.$count(posts, eq(posts.organizationId, organization.id)),
    db.$count(memberships, eq(memberships.organizationId, organization.id)),
    getOrganizationSubscription(organization.id),
  ]);
  const planId = effectivePlan(subscription?.status);

  const stats = [
    { label: "Boards", value: String(boardCount) },
    { label: "Feedback posts", value: String(postCount) },
    { label: "Members", value: String(memberCount) },
    { label: "Plan", value: plans[planId].name },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Overview</h1>
      <p className="mt-1 text-muted-foreground">
        Welcome back. Here is what is happening in {endSentence(organization.name)}
      </p>

      {hasPaymentProblem(subscription?.status) && (
        <PaymentProblemNotice slug={slug} canManage={can(role, "billing:manage")} showBillingLink />
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border p-5">
            <p className="text-sm text-subtle-foreground">{stat.label}</p>
            <p className="mt-1 text-3xl font-semibold capitalize">{stat.value}</p>
          </div>
        ))}
      </div>

      {postCount === 0 && <GetStarted slug={slug} organization={organization} />}
    </div>
  );
}
