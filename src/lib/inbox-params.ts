import { parseSearch } from "./portal-params";
import { isPostStatus, type PostStatus } from "./post-status";
import { buildHref, firstParam, parsePage, type RawSearchParams } from "./url-params";

// The team's feedback inbox options (?status=planned&board=bugs&sort=top&q=csv&page=2).
// Newest first by default: the team wants to see what just came in.

export const INBOX_PAGE_SIZE = 50;

export const inboxSorts = { new: "Newest", top: "Most votes" } as const;
export type InboxSort = keyof typeof inboxSorts;

export function parseInboxParams(params: RawSearchParams) {
  const status = firstParam(params.status);
  return {
    status: (isPostStatus(status) ? status : null) as PostStatus | null,
    board: firstParam(params.board)?.trim() || null,
    sort: (firstParam(params.sort) === "top" ? "top" : "new") as InboxSort,
    q: parseSearch(params.q),
    page: parsePage(params.page),
  };
}

export type InboxParams = ReturnType<typeof parseInboxParams>;

export function inboxHref(base: string, current: InboxParams, change: Partial<InboxParams>) {
  return buildHref(base, { ...current, ...change }, { sort: "new", page: 1 });
}
