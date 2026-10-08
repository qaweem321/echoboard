import { buildHref, firstParam, parsePage, type RawSearchParams } from "./url-params";

// Reads the portal's list options from the URL (?board=bugs&sort=new&q=export&page=2).
// Anything unexpected falls back to the default instead of failing.

export const PORTAL_PAGE_SIZE = 30;
export const SEARCH_MAX = 100;

export const portalSorts = { top: "Top", new: "New" } as const;
export type PortalSort = keyof typeof portalSorts;

export function parseSearch(value: RawSearchParams[string]) {
  return (firstParam(value) ?? "").trim().slice(0, SEARCH_MAX);
}

export function parsePortalParams(params: RawSearchParams) {
  return {
    board: firstParam(params.board)?.trim() || null,
    sort: (firstParam(params.sort) === "new" ? "new" : "top") as PortalSort,
    q: parseSearch(params.q),
    page: parsePage(params.page),
  };
}

export type PortalParams = ReturnType<typeof parsePortalParams>;

// A portal link that keeps the current options, with some of them changed.
export function portalHref(base: string, current: PortalParams, change: Partial<PortalParams>) {
  return buildHref(base, { ...current, ...change }, { sort: "top", page: 1 });
}
