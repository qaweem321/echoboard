import assert from "node:assert/strict";
import { test } from "node:test";
import { isPostStatus, listedStatuses, postStatuses, postStatusLabels } from "./post-status";

test("every status has a label", () => {
  for (const status of postStatuses) {
    assert.ok(postStatusLabels[status], status);
  }
});

test("isPostStatus only accepts real statuses", () => {
  assert.equal(isPostStatus("planned"), true);
  assert.equal(isPostStatus("done"), false);
  assert.equal(isPostStatus(undefined), false);
});

test("closed posts are not listed", () => {
  assert.equal(listedStatuses.includes("closed" as never), false);
  assert.equal(listedStatuses.length, postStatuses.length - 1);
});
