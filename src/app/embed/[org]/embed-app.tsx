"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { WIDGET_CLOSE_MESSAGE } from "@/lib/embed";
import { EmbedIdeaForm } from "./embed-idea-form";
import { EmbedPostList } from "./embed-post-list";
import { useVoterToken } from "./use-voter-token";

type Props = {
  organization: { slug: string; name: string };
  boards: { id: string; name: string }[];
};

type View = "ideas" | "share";

// The page around the widget listens for this and closes the panel (public/widget.js).
function closePanel() {
  window.parent.postMessage({ type: WIDGET_CLOSE_MESSAGE }, "*");
}

export function EmbedApp({ organization, boards }: Props) {
  const token = useVoterToken(organization.slug);
  const [view, setView] = useState<View>("ideas");
  const [notice, setNotice] = useState<string | null>(null);
  // Bumped after posting an idea, so the list reloads and shows it.
  const [listVersion, setListVersion] = useState(0);
  const [inFrame, setInFrame] = useState(false);

  useEffect(() => {
    const framed = window.parent !== window;
    setInFrame(framed);
    if (!framed) {
      return;
    }
    // Key presses inside the panel don't reach the website around it, so Escape is handled here.
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePanel();
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <p className="truncate font-semibold">{organization.name} feedback</p>
        {inFrame && (
          <button
            type="button"
            onClick={closePanel}
            aria-label="Close feedback"
            className="rounded-md p-1.5 text-subtle-foreground hover:bg-accent hover:text-foreground"
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </header>

      <nav aria-label="Widget" className="flex gap-1 border-b border-border px-3 py-2">
        {(
          [
            ["ideas", "Ideas"],
            ["share", "Share an idea"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setView(value);
              setNotice(null);
            }}
            aria-current={view === value ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              view === value ? "bg-accent font-medium" : "text-muted-foreground hover:bg-accent",
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {notice && (
          <p className="mb-3 rounded-lg bg-success/10 p-3 text-sm text-success">{notice}</p>
        )}
        {!token ? (
          <p className="text-sm text-subtle-foreground">Loading...</p>
        ) : view === "ideas" ? (
          <EmbedPostList key={listVersion} organizationSlug={organization.slug} token={token} />
        ) : boards.length === 0 ? (
          <p className="text-sm text-subtle-foreground">
            {organization.name} isn&apos;t collecting ideas yet.
          </p>
        ) : (
          <EmbedIdeaForm
            organizationSlug={organization.slug}
            token={token}
            boards={boards}
            onPosted={() => {
              setNotice("Thanks! Your idea is posted, with your vote.");
              setListVersion((version) => version + 1);
              setView("ideas");
            }}
          />
        )}
      </div>

      <footer className="border-t border-border px-4 py-2 text-center text-xs">
        <a
          href={`/p/${organization.slug}`}
          target="_blank"
          rel="noopener"
          className="text-link hover:underline"
        >
          Open the full feedback portal ↗
        </a>
      </footer>
    </div>
  );
}
