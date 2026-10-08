import assert from "node:assert/strict";
import { test } from "node:test";
import { can, isRole } from "./permissions";

test("owners can do everything", () => {
  for (const permission of [
    "organization:update",
    "organization:delete",
    "member:remove",
    "member:invite",
    "member:update-role",
    "billing:manage",
    "board:manage",
  ] as const) {
    assert.equal(can("owner", permission), true, permission);
  }
});

test("admins manage people but not ownership or money", () => {
  assert.equal(can("admin", "member:invite"), true);
  assert.equal(can("admin", "member:remove"), true);
  assert.equal(can("admin", "organization:update"), true);
  assert.equal(can("admin", "member:update-role"), false);
  assert.equal(can("admin", "billing:manage"), false);
  assert.equal(can("admin", "organization:delete"), false);
});

test("members cannot change anything", () => {
  assert.equal(can("member", "member:invite"), false);
  assert.equal(can("member", "organization:update"), false);
  assert.equal(can("member", "billing:manage"), false);
});

test("isRole only accepts real roles", () => {
  assert.equal(isRole("admin"), true);
  assert.equal(isRole("superadmin"), false);
  assert.equal(isRole(""), false);
});

test("only owners and admins manage boards", () => {
  assert.equal(can("admin", "board:manage"), true);
  assert.equal(can("member", "board:manage"), false);
});
