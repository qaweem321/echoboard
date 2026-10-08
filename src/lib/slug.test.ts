import assert from "node:assert/strict";
import { test } from "node:test";
import { slugify } from "./slug";

test("turns names into URL-friendly slugs", () => {
  assert.equal(slugify("Acme Inc."), "acme-inc");
  assert.equal(slugify("Qaweem's Studio!"), "qaweem-s-studio");
  assert.equal(slugify("  Many   Spaces  "), "many-spaces");
});

test("falls back when nothing usable is left", () => {
  assert.equal(slugify("!!!"), "org");
  assert.equal(slugify("日本"), "org");
});
