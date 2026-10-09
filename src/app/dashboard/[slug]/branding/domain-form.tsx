"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { type DomainState, saveDomain } from "./actions";

type Props = { slug: string; customDomain: string | null; appHost: string; canEdit: boolean };

const dnsMessages = {
  ok: { text: "DNS is set up: the domain points to this app.", className: "text-success" },
  "not-pointing": {
    text: "The domain exists but doesn't point to this app yet. Check the CNAME record.",
    className: "text-danger",
  },
  "not-found": {
    text: "No DNS record found yet. After adding the CNAME record, it can take up to an hour.",
    className: "text-subtle-foreground",
  },
};

export function DomainForm({ slug, customDomain, appHost, canEdit }: Props) {
  const [state, formAction] = useActionState(saveDomain, {} as DomainState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="slug" value={slug} />
      <label htmlFor="custom-domain" className="block text-sm font-medium">
        Your domain
      </label>
      <div className="flex flex-wrap gap-2">
        <div className="min-w-56 flex-1">
          <Input
            id="custom-domain"
            name="customDomain"
            defaultValue={customDomain ?? ""}
            placeholder="feedback.yourcompany.com"
            disabled={!canEdit}
          />
        </div>
        {canEdit && <SubmitButton pendingText="Saving...">Save domain</SubmitButton>}
      </div>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>
          At your domain provider, add a <strong>CNAME</strong> record for your domain pointing to{" "}
          <code className="text-foreground">{appHost}</code>.
        </li>
        <li>
          When the record is in place (usually minutes, sometimes up to an hour), save the domain
          here. Leave the box empty to stop using it.
        </li>
      </ol>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.error && state.dns && (
        <p className={`text-sm ${dnsMessages[state.dns].className}`}>
          {dnsMessages[state.dns].text}
        </p>
      )}
      {state.saved && (
        <p className="text-sm text-success">
          Saved.{" "}
          {state.dns && (
            <span className={dnsMessages[state.dns].className}>{dnsMessages[state.dns].text}</span>
          )}
        </p>
      )}
    </form>
  );
}
