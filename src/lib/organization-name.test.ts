import assert from "node:assert/strict";
import { test } from "node:test";
import { checkOrganizationName } from "./organization-name";

test("trims and accepts normal names", () => {
  assert.deepEqual(checkOrganizationName("  Acme Inc.  "), { name: "Acme Inc." });
});

test("rejects blank and too-long names", () => {
  assert.deepEqual(checkOrganizationName("   "), { error: "Please enter a name." });
  assert.deepEqual(checkOrganizationName(null), { error: "Please enter a name." });
  assert.ok("error" in checkOrganizationName("x".repeat(61)));
});
