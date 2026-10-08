import assert from "node:assert/strict";
import { test } from "node:test";
import { hashVoterToken, isVoterToken, newVoterToken } from "./voter-token";

test("new tokens are valid and different", () => {
  const a = newVoterToken();
  assert.equal(isVoterToken(a), true);
  assert.notEqual(a, newVoterToken());
});

test("the same token hashes differently per workspace", () => {
  const token = newVoterToken();
  assert.equal(hashVoterToken("org-1", token), hashVoterToken("org-1", token));
  assert.notEqual(hashVoterToken("org-1", token), hashVoterToken("org-2", token));
});

test("isVoterToken rejects anything we didn't create", () => {
  for (const value of [undefined, "", "short", "x".repeat(44), `${"x".repeat(42)}!`]) {
    assert.equal(isVoterToken(value), false, String(value));
  }
});
