import assert from "node:assert/strict";
import { test } from "node:test";
import { inboxHref, parseInboxParams } from "./inbox-params";

test("inbox defaults to all statuses, newest first", () => {
  assert.deepEqual(parseInboxParams({}), {
    status: null,
    board: null,
    sort: "new",
    q: "",
    page: 1,
  });
});

test("inbox reads valid options and ignores bad ones", () => {
  const params = parseInboxParams({ status: "planned", sort: "top", page: "2" });
  assert.equal(params.status, "planned");
  assert.equal(params.sort, "top");
  assert.equal(params.page, 2);
  assert.equal(parseInboxParams({ status: "done" }).status, null);
});

test("inboxHref drops defaults", () => {
  const current = parseInboxParams({ status: "open", page: "3" });
  assert.equal(inboxHref("/f", current, { page: 1 }), "/f?status=open");
  assert.equal(inboxHref("/f", current, { status: null, page: 1 }), "/f");
});
