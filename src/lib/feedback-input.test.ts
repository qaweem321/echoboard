import assert from "node:assert/strict";
import { test } from "node:test";
import {
  COMMENT_MAX,
  checkCommentInput,
  checkPostInput,
  checkVoterDetails,
  escapeLike,
  POST_BODY_MAX,
  POST_TITLE_MAX,
  VOTER_NAME_MAX,
} from "./feedback-input";

test("post title is trimmed and its spaces collapsed", () => {
  assert.deepEqual(checkPostInput("  Dark    mode  ", "  Please "), {
    title: "Dark mode",
    body: "Please",
  });
});

test("post title must be 3 to 120 characters", () => {
  assert.ok("error" in checkPostInput("ab", ""));
  assert.ok("error" in checkPostInput(null, ""));
  assert.ok("error" in checkPostInput("x".repeat(POST_TITLE_MAX + 1), ""));
  assert.ok(!("error" in checkPostInput("abc", "")));
});

test("post details are optional and limited", () => {
  assert.deepEqual(checkPostInput("Dark mode", "   "), { title: "Dark mode", body: null });
  assert.ok("error" in checkPostInput("Dark mode", "x".repeat(POST_BODY_MAX + 1)));
});

test("comments must have text and a limited length", () => {
  assert.ok("error" in checkCommentInput("   "));
  assert.ok("error" in checkCommentInput("x".repeat(COMMENT_MAX + 1)));
  assert.deepEqual(checkCommentInput(" Me too! "), { body: "Me too!" });
});

test("voter details are optional, emails lowercased and checked", () => {
  assert.deepEqual(checkVoterDetails("", ""), { name: null, email: null });
  assert.deepEqual(checkVoterDetails(" Ann ", " Ann@Example.COM "), {
    name: "Ann",
    email: "ann@example.com",
  });
  assert.ok("error" in checkVoterDetails("Ann", "not-an-email"));
  assert.ok("error" in checkVoterDetails("x".repeat(VOTER_NAME_MAX + 1), ""));
});

test("escapeLike escapes wildcards", () => {
  assert.equal(escapeLike("100%_done\\"), "100\\%\\_done\\\\");
  assert.equal(escapeLike("plain"), "plain");
});
