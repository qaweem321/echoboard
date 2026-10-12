import Link from "next/link";
import { paymentProblemTitle } from "@/lib/billing/plans";

type Props = { slug: string; status: string; canManage: boolean; showBillingLink?: boolean };

// Shown when the organization's subscription isn't being paid. Pro features are paused until
// the card is updated in the billing portal.
export function PaymentProblemNotice({ slug, status, canManage, showBillingLink = false }: Props) {
  return (
    <div
      role="alert"
      className="mt-6 rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-foreground"
    >
      <p className="font-medium text-danger">{paymentProblemTitle(status)}</p>
      <p className="mt-1 text-muted-foreground">
        {canManage
          ? "Update your card under Manage subscription to keep using Pro."
          : "Ask an owner of this workspace to update the payment method."}
        {showBillingLink && canManage && (
          <>
            {" "}
            <Link href={`/dashboard/${slug}/billing`} className="text-link hover:underline">
              Go to Billing
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
