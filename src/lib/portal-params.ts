// Reads the portal's list options from the URL (?board=bugs&sort=new&q=export&page=2).
// Anything unexpected falls back to the default instead of failing.

export const PORTAL_PAGE_SIZE = 30;
export const SEARCH_MAX = 100;

export const portalSorts = { top: "Top", new: "New" } as const;
export type PortalSort = keyof typeof portalSorts;

type Param = string | string[] | undefined;

function first(value: Param) {
  return Array.isArray(value) ? value[0] : value;
}

export function parsePortalParams(params: Record<string, Param>) {
  const sort = first(params.sort);
  const page = Number.parseInt(first(params.page) ?? "", 10);
  return {
    board: first(params.board)?.trim() || null,
    sort: (sort === "new" ? "new" : "top") as PortalSort,
    q: (first(params.q) ?? "").trim().slice(0, SEARCH_MAX),
    page: Number.isSafeInteger(page) && page > 1 ? page : 1,
  };
}

export type PortalParams = ReturnType<typeof parsePortalParams>;

// Builds a portal link that keeps the current options, with some of them changed.
// Default values are left out so links stay short.
export function portalHref(base: string, current: PortalParams, change: Partial<PortalParams>) {
  const next = { ...current, ...change };
  const search = new URLSearchParams();
  if (next.board) search.set("board", next.board);
  if (next.sort !== "top") search.set("sort", next.sort);
  if (next.q) search.set("q", next.q);
  if (next.page > 1) search.set("page", String(next.page));
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}
