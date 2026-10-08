import assert from "node:assert/strict";
import { test } from "node:test";
import { organizationSlugFromPath, pickOrganization } from "./last-organization";

test("reads the organization slug from dashboard paths only", () => {
  assert.equal(organizationSlugFromPath("/dashboard/acme/members"), "acme");
  assert.equal(organizationSlugFromPath("/dashboard/acme"), "acme");
  assert.equal(organizationSlugFromPath("/dashboard"), null);
  assert.equal(organizationSlugFromPath("/onboarding"), null);
});

test("opens the last-used organization, if the user still belongs to it", () => {
  const organizations = [{ slug: "acme" }, { slug: "studio" }];
  assert.equal(pickOrganization(organizations, "studio")?.slug, "studio");
});

test("opens the only organization without asking", () => {
  assert.equal(pickOrganization([{ slug: "acme" }], undefined)?.slug, "acme");
  assert.equal(pickOrganization([{ slug: "acme" }], "left-long-ago")?.slug, "acme");
});

test("asks when there are several and no valid last-used one", () => {
  const organizations = [{ slug: "acme" }, { slug: "studio" }];
  assert.equal(pickOrganization(organizations, undefined), undefined);
  assert.equal(pickOrganization(organizations, "left-long-ago"), undefined);
  assert.equal(pickOrganization([], "acme"), undefined);
});
