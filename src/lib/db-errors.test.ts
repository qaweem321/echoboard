import assert from "node:assert/strict";
import { test } from "node:test";
import { isUniqueViolation } from "./db-errors";

test("recognizes a unique violation, also when wrapped", () => {
  assert.equal(isUniqueViolation({ code: "23505" }), true);
  assert.equal(isUniqueViolation(new Error("query failed", { cause: { code: "23505" } })), true);
  assert.equal(isUniqueViolation(new Error("other")), false);
  assert.equal(isUniqueViolation(null), false);
});
