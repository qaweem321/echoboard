"use client";

import { useEffect, useState } from "react";

type Similar = { id: string; title: string; voteCount: number };

type Props = {
  organizationSlug: string;
  // The title being typed.
  title: string;
  // Start of links to posts: "/p/acme", or "" on the workspace's own domain.
  base: string;
  // In the widget, links open the full portal in a new tab.
  newTab?: boolean;
};

const DELAY_MS = 400;
const MIN_LENGTH = 4;

// "Similar ideas already shared": shown while someone types a new idea, so they can vote for
// an existing one instead of posting a duplicate.
export function SimilarIdeas({ organizationSlug, title, base, newTab = false }: Props) {
  const [similar, setSimilar] = useState<Similar[]>([]);

  useEffect(() => {
    const text = title.trim();
    if (text.length < MIN_LENGTH) {
      setSimilar([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(
        `/api/embed/${encodeURIComponent(organizationSlug)}/similar?q=${encodeURIComponent(text)}`,
        { signal: controller.signal },
      )
        .then((response) => (response.ok ? response.json() : { posts: [] }))
        .then((data: { posts: Similar[] }) => setSimilar(data.posts))
        // A hint is optional: if it fails, the form still works.
        .catch(() => undefined);
    }, DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [organizationSlug, title]);

  if (similar.length === 0) {
    return null;
  }
  return (
    <div aria-live="polite" className="rounded-lg bg-surface p-3 text-sm">
      <p className="font-medium">Similar ideas already shared. Vote for one instead?</p>
      <ul className="mt-1 space-y-0.5">
        {similar.map((post) => (
          <li key={post.id}>
            <a
              href={`${base}/posts/${post.id}`}
              target={newTab ? "_blank" : undefined}
              rel={newTab ? "noopener" : undefined}
              className="text-link hover:underline"
            >
              {post.title}
            </a>{" "}
            <span className="text-subtle-foreground">
              ({post.voteCount} {post.voteCount === 1 ? "vote" : "votes"})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
