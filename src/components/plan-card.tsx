import type { ReactNode } from "react";
import { limitLabel, type Plan } from "@/lib/billing/plans";
import { cn } from "@/lib/cn";

type Props = {
  plan: Plan;
  highlighted?: boolean;
  // Small label above the plan name, like "Current plan".
  badge?: string;
  // The button or note at the bottom of the card.
  children?: ReactNode;
};

// One plan's name, price and features. Used by the landing page and the Billing page.
export function PlanCard({ plan, highlighted = false, badge, children }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border p-8",
        highlighted ? "border-link" : "border-border",
      )}
    >
      {badge && <p className="mb-2 text-xs font-semibold uppercase text-link">{badge}</p>}
      <h3 className="text-lg font-semibold">{plan.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
      <p className="mt-6 text-4xl font-bold">{plan.price}</p>
      <ul className="mt-6 flex-1 space-y-2 text-sm">
        {[
          limitLabel(plan.memberLimit, "team member", "team members"),
          limitLabel(plan.boardLimit, "board", "boards"),
          ...plan.features,
        ].map((feature) => (
          <li key={feature} className="flex gap-2">
            <span aria-hidden="true" className="text-success">
              ✓
            </span>
            {feature}
          </li>
        ))}
      </ul>
      {children && <div className="mt-8 flex flex-col">{children}</div>}
    </div>
  );
}
