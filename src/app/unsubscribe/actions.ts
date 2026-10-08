"use server";

import { unsubscribeVoter } from "@/lib/notifications/unsubscribe";

export type UnsubscribeState = { done?: boolean; error?: string };

export async function unsubscribe(
  _previous: UnsubscribeState,
  formData: FormData,
): Promise<UnsubscribeState> {
  const ok = await unsubscribeVoter(formData.get("v"), formData.get("t"));
  return ok ? { done: true } : { error: "This unsubscribe link is not valid." };
}
