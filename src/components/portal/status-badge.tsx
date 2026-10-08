import { cn } from "@/lib/cn";
import { type PostStatus, postStatusLabels } from "@/lib/post-status";

// Each status gets its own color so the list and roadmap can be scanned at a glance.
const statusColors: Record<PostStatus, string> = {
  open: "bg-muted text-muted-foreground",
  under_review: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  planned: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  in_progress: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  complete: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  closed: "bg-red-500/10 text-danger",
};

export function StatusBadge({ status, className }: { status: PostStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
        statusColors[status],
        className,
      )}
    >
      {postStatusLabels[status]}
    </span>
  );
}
