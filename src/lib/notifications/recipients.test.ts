import assert from "node:assert/strict";
import { test } from "node:test";
import { groupRecipients } from "./recipients";

test("one recipient per email, with each post once", () => {
  const recipients = groupRecipients([
    { voterId: "v1", email: "a@x.test", name: null, postId: "p1", title: "One" },
    { voterId: "v2", email: "a@x.test", name: "Ann", postId: "p1", title: "One" },
    { voterId: "v1", email: "a@x.test", name: null, postId: "p2", title: "Two" },
    { voterId: "v3", email: "b@x.test", name: "Bo", postId: "p2", title: "Two" },
  ]);
  assert.equal(recipients.length, 2);
  assert.deepEqual(recipients[0], {
    voterId: "v1",
    email: "a@x.test",
    name: "Ann",
    posts: [
      { id: "p1", title: "One" },
      { id: "p2", title: "Two" },
    ],
  });
  assert.equal(recipients[1].name, "Bo");
});

test("no rows, no recipients", () => {
  assert.deepEqual(groupRecipients([]), []);
});
