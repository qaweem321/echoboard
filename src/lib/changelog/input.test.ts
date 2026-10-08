import assert from "node:assert/strict";
import { test } from "node:test";
import { checkEntryInput, ENTRY_BODY_MAX, ENTRY_TITLE_MAX } from "./input";

test("entry input is trimmed and the body may be empty", () => {
  assert.deepEqual(checkEntryInput("  October release ", " "), {
    title: "October release",
    body: "",
  });
});

test("entry title is required and limited", () => {
  assert.ok("error" in checkEntryInput("   ", "text"));
  assert.ok("error" in checkEntryInput("x".repeat(ENTRY_TITLE_MAX + 1), ""));
});

test("entry body is limited", () => {
  assert.ok("error" in checkEntryInput("Title", "x".repeat(ENTRY_BODY_MAX + 1)));
});
