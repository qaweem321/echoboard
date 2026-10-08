import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidEmail } from "./email-address";

test("accepts normal email addresses", () => {
  assert.equal(isValidEmail("maya@acme.test"), true);
  assert.equal(isValidEmail("first.last+tag@mail.example.co.uk"), true);
});

test("rejects malformed addresses", () => {
  for (const email of ["a@b", "no-at-sign.com", "two@@at.com", "space @x.com", "a@.com", "a@x."]) {
    assert.equal(isValidEmail(email), false, email);
  }
});

test("rejects huge inputs quickly", () => {
  const start = performance.now();
  assert.equal(isValidEmail(`a@${"a".repeat(50_000)}`), false);
  assert.ok(performance.now() - start < 50);
});
