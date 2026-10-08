import assert from "node:assert/strict";
import { test } from "node:test";
import { endSentence, formatDate } from "./format";

test("formats dates with the month name, in UTC", () => {
  assert.equal(formatDate(new Date("2026-10-11T12:00:00Z")), "Oct 11, 2026");
  assert.equal(formatDate(new Date("2026-01-01T00:30:00Z")), "Jan 1, 2026");
});

test("ends a sentence without doubling the full stop", () => {
  assert.equal(endSentence("Acme"), "Acme.");
  assert.equal(endSentence("Acme Inc."), "Acme Inc.");
  assert.equal(endSentence("Yay!"), "Yay!");
});
