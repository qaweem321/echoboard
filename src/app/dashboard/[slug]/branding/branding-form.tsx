"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { type BrandingState, saveBranding } from "./actions";

type Props = {
  slug: string;
  brandColor: string | null;
  logoUrl: string | null;
  hidePoweredBy: boolean;
  canEdit: boolean;
  // Hiding "Powered by" is a paid feature (src/lib/billing/plans.ts).
  canRemoveBranding: boolean;
  billingHref: string;
};

const DEFAULT_COLOR = "#2563eb";

export function BrandingForm({
  slug,
  brandColor,
  logoUrl,
  hidePoweredBy,
  canEdit,
  canRemoveBranding,
  billingHref,
}: Props) {
  const [state, formAction] = useActionState(saveBranding, {} as BrandingState);
  // The color picker and the text box show the same value.
  const [color, setColor] = useState(brandColor ?? "");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <fieldset disabled={!canEdit} className="space-y-4">
        <div>
          <label htmlFor="brand-color" className="mb-1 block text-sm font-medium">
            Brand color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label="Pick a brand color"
              value={/^#[0-9a-f]{6}$/i.test(color) ? color : DEFAULT_COLOR}
              onChange={(event) => setColor(event.target.value)}
              className="h-10 w-12 cursor-pointer rounded border border-input bg-background"
            />
            <div className="w-36">
              <Input
                id="brand-color"
                name="brandColor"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                placeholder={DEFAULT_COLOR}
                maxLength={7}
              />
            </div>
          </div>
          <p className="mt-1 text-xs text-subtle-foreground">
            Used for buttons and votes. Leave empty for the default blue.
          </p>
        </div>
        <div>
          <label htmlFor="logo-url" className="mb-1 block text-sm font-medium">
            Logo link
          </label>
          <Input
            id="logo-url"
            name="logoUrl"
            type="url"
            defaultValue={logoUrl ?? ""}
            placeholder="https://yourcompany.com/logo.png"
          />
          <p className="mt-1 text-xs text-subtle-foreground">
            An image on your website (https). Without one, the portal shows your workspace name.
          </p>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="hidePoweredBy"
            defaultChecked={hidePoweredBy && canRemoveBranding}
            disabled={!canRemoveBranding}
            className="mt-1"
          />
          <span>
            Hide the &ldquo;Powered by&rdquo; line at the bottom of the portal
            {!canRemoveBranding && (
              <>
                {" "}
                <a href={billingHref} className="text-link hover:underline">
                  (Pro)
                </a>
              </>
            )}
          </span>
        </label>
      </fieldset>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.saved && <p className="text-sm text-success">Saved.</p>}
      {canEdit && <SubmitButton pendingText="Saving...">Save branding</SubmitButton>}
    </form>
  );
}
