// Kept free of database imports, so client components can use it too.
export const postStatuses = [
  "open",
  "under_review",
  "planned",
  "in_progress",
  "complete",
  "closed",
] as const;

export type PostStatus = (typeof postStatuses)[number];

export const postStatusLabels: Record<PostStatus, string> = {
  open: "Open",
  under_review: "Under review",
  planned: "Planned",
  in_progress: "In progress",
  complete: "Complete",
  closed: "Closed",
};

export function isPostStatus(value: unknown): value is PostStatus {
  return (postStatuses as readonly unknown[]).includes(value);
}

// Closed posts (won't do) stay reachable by link but are left out of the public lists.
export const listedStatuses = postStatuses.filter((status) => status !== "closed");
