import { revalidatePath } from "next/cache";

// After feedback changes, re-render the portal pages that show it.
export function refreshPortal(organizationSlug: string, postId?: string) {
  revalidatePath(`/p/${organizationSlug}`);
  if (postId) {
    revalidatePath(`/p/${organizationSlug}/posts/${postId}`);
  }
}
