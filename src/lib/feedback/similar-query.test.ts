import assert from "node:assert/strict";
import { test } from "node:test";
import { similarSearchQuery } from "./similar-query";

test("matches any word, as a prefix", () => {
  assert.equal(similarSearchQuery("Export reports to CSV"), "export:* | reports:* | csv:*");
});

test("drops short words, repeats and symbols", () => {
  assert.equal(similarSearchQuery("CSV csv!! & a | b ' or 1=1"), "csv:*");
  assert.equal(similarSearchQuery("to a an"), null);
  assert.equal(similarSearchQuery(""), null);
});

test("keeps letters from other languages and limits the words", () => {
  assert.equal(similarSearchQuery("Mode sombre élégant"), "mode:* | sombre:* | élégant:*");
  assert.equal(similarSearchQuery("one two three four five six seven eight")?.split("|").length, 6);
});
