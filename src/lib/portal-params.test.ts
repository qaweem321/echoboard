import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePortalParams, portalHref, SEARCH_MAX } from "./portal-params";

test("defaults when the URL has no options", () => {
  assert.deepEqual(parsePortalParams({}), { board: null, sort: "top", q: "", page: 1 });
});

test("reads valid options and ignores bad ones", () => {
  assert.deepEqual(parsePortalParams({ board: " bugs ", sort: "new", q: " csv ", page: "3" }), {
    board: "bugs",
    sort: "new",
    q: "csv",
    page: 3,
  });
  const bad = parsePortalParams({ sort: "random", page: "-2", q: "x".repeat(500) });
  assert.equal(bad.sort, "top");
  assert.equal(bad.page, 1);
  assert.equal(bad.q.length, SEARCH_MAX);
  assert.equal(parsePortalParams({ page: "abc" }).page, 1);
  assert.equal(parsePortalParams({ sort: ["new", "top"] }).sort, "new");
});

test("portalHref keeps options and drops defaults", () => {
  const current = parsePortalParams({ board: "bugs", q: "csv", page: "2" });
  assert.equal(portalHref("/p/acme", current, { page: 1 }), "/p/acme?board=bugs&q=csv");
  assert.equal(
    portalHref("/p/acme", current, { sort: "new" }),
    "/p/acme?board=bugs&sort=new&q=csv&page=2",
  );
  assert.equal(portalHref("/p/acme", parsePortalParams({}), {}), "/p/acme");
});
