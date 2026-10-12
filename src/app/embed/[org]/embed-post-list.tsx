"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/portal/status-badge";
import { VoteBox } from "@/components/portal/vote-box";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { EMBED_TOKEN_HEADER } from "@/lib/embed";
import { type PortalSort, portalSorts, SEARCH_MAX } from "@/lib/portal-params";
import type { PostStatus } from "@/lib/post-status";
import { embedVote } from "./actions";

type Post = {
  id: string;
  title: string;
  status: PostStatus;
  voteCount: number;
  commentCount: number;
  voted: boolean;
};

type Props = { organizationSlug: string; portalUrl: string; token: string };

// Waits for a pause in typing before searching, so each key press isn't a request.
const SEARCH_DELAY_MS = 300;

export function EmbedPostList({ organizationSlug, portalUrl, token }: Props) {
  const [sort, setSort] = useState<PortalSort>("top");
  const [typed, setTyped] = useState("");
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(typed.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [typed]);

  useEffect(() => {
    const controller = new AbortController();
    const search = new URLSearchParams({ sort, q: query });
    fetch(`/api/embed/${encodeURIComponent(organizationSlug)}/posts?${search}`, {
      headers: { [EMBED_TOKEN_HEADER]: token },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Loading ideas failed (${response.status})`);
        }
        return response.json() as Promise<{ posts: Post[] }>;
      })
      .then((data) => {
        setPosts(data.posts);
        setFailed(false);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error(error);
          setFailed(true);
        }
      });
    return () => controller.abort();
  }, [organizationSlug, token, sort, query]);

  // Flips the vote straight away; if the server refuses, flips it back.
  async function vote(post: Post) {
    const intent = post.voted ? "remove" : "add";
    const flip = (target: Post) =>
      target.id === post.id
        ? {
            ...target,
            voted: !target.voted,
            voteCount: target.voteCount + (target.voted ? -1 : 1),
          }
        : target;
    setPosts((current) => current?.map(flip) ?? null);
    const result = await embedVote(organizationSlug, token, post.id, intent).catch(() => ({
      ok: false,
    }));
    if (!result.ok) {
      setPosts((current) => current?.map(flip) ?? null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {(Object.keys(portalSorts) as PortalSort[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSort(value)}
            aria-pressed={sort === value}
            className={cn(
              "rounded-md px-2.5 py-1 text-sm",
              sort === value ? "bg-accent font-medium" : "text-muted-foreground hover:bg-accent",
            )}
          >
            {portalSorts[value]}
          </button>
        ))}
        <div className="min-w-0 flex-1">
          <Input
            type="search"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            maxLength={SEARCH_MAX}
            placeholder="Search ideas"
            className="py-1.5 text-sm"
          />
        </div>
      </div>

      {failed ? (
        <p className="text-sm text-danger">Ideas couldn&apos;t be loaded. Please try again.</p>
      ) : posts === null ? (
        <p className="text-sm text-subtle-foreground">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {query ? "No matching ideas. Share it as a new one!" : "No ideas yet. Be the first!"}
        </p>
      ) : (
        <ul className="space-y-2">
          {posts.map((post) => (
            <li key={post.id} className="flex gap-3 rounded-lg border border-border p-3">
              <VoteBox
                voted={post.voted}
                count={post.voteCount}
                title={post.title}
                onClick={() => vote(post)}
              />
              <div className="min-w-0">
                <a
                  href={`${portalUrl}/posts/${post.id}`}
                  target="_blank"
                  rel="noopener"
                  className="text-sm font-medium break-words hover:underline"
                >
                  {post.title}
                </a>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-subtle-foreground">
                  {post.status !== "open" && <StatusBadge status={post.status} />}
                  <span>
                    {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
