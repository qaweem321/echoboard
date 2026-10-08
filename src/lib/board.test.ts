import assert from "node:assert/strict";
import { test } from "node:test";
import { BOARD_DESCRIPTION_MAX, BOARD_NAME_MAX, checkBoardInput, uniqueSlug } from "./board";

test("board input is trimmed", () => {
  assert.deepEqual(checkBoardInput("  Bugs ", " Things that break "), {
    name: "Bugs",
    description: "Things that break",
  });
});

test("board name is required and limited", () => {
  assert.ok("error" in checkBoardInput("   ", ""));
  assert.ok("error" in checkBoardInput(null, null));
  assert.ok("error" in checkBoardInput("x".repeat(BOARD_NAME_MAX + 1), ""));
  assert.ok(!("error" in checkBoardInput("x".repeat(BOARD_NAME_MAX), "")));
});

test("board description is optional and limited", () => {
  assert.deepEqual(checkBoardInput("Ideas", undefined), { name: "Ideas", description: "" });
  assert.ok("error" in checkBoardInput("Ideas", "x".repeat(BOARD_DESCRIPTION_MAX + 1)));
});

test("uniqueSlug adds the first free number", () => {
  assert.equal(uniqueSlug("bugs", []), "bugs");
  assert.equal(uniqueSlug("bugs", ["bugs"]), "bugs-2");
  assert.equal(uniqueSlug("bugs", ["bugs", "bugs-2", "bugs-3"]), "bugs-4");
  assert.equal(uniqueSlug("bugs", ["bugs-2"]), "bugs");
});
