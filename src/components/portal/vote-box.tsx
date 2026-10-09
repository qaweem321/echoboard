import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Props = Omit<ComponentProps<"button">, "children"> & {
  voted: boolean;
  count: number;
  title: string;
};

// The upvote box (arrow and count). Shared by the portal and the embeddable widget.
export function VoteBox({ voted, count, title, className, ...props }: Props) {
  return (
    <button
      type="button"
      aria-pressed={voted}
      aria-label={`${voted ? "Remove your vote for" : "Vote for"} ${title} (${count} votes)`}
      className={cn(
        "flex w-14 shrink-0 flex-col items-center rounded-lg border py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-blue-600",
        voted
          ? "border-link bg-link/10 text-link"
          : "border-border text-foreground hover:border-link",
        className,
      )}
      {...props}
    >
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 5l8 10H4z" />
      </svg>
      {count}
    </button>
  );
}
