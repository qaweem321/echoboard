import { revalidatePath } from "next/cache";

// After feedback changes, re-render the workspace's portal pages (list, roadmap, posts).
export function refreshPortal(organizationSlug: string) {
  revalidatePath(`/p/${organizationSlug}`, "layout");
}
