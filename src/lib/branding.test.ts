import assert from "node:assert/strict";
import { test } from "node:test";
import { checkLogoUrl, normalizeDomain, normalizeHexColor, readableTextColor } from "./branding";

test("colors are normalized to #rrggbb", () => {
  assert.deepEqual(normalizeHexColor(" #2563EB "), { color: "#2563eb" });
  assert.deepEqual(normalizeHexColor("25e"), { color: "#2255ee" });
  assert.deepEqual(normalizeHexColor(""), { color: null });
  for (const bad of ["red", "#12345", "#gggggg", "rgb(1,2,3)"]) {
    assert.ok("error" in normalizeHexColor(bad), bad);
  }
});

test("text on a brand color stays readable", () => {
  assert.equal(readableTextColor("#2563eb"), "#ffffff");
  assert.equal(readableTextColor("#000000"), "#ffffff");
  assert.equal(readableTextColor("#facc15"), "#111827");
  assert.equal(readableTextColor("#ffffff"), "#111827");
});

test("logo links must be https", () => {
  assert.deepEqual(checkLogoUrl(""), { url: null });
  assert.deepEqual(checkLogoUrl(" https://cdn.acme.com/logo.png "), {
    url: "https://cdn.acme.com/logo.png",
  });
  assert.ok("error" in checkLogoUrl("http://cdn.acme.com/logo.png"));
  assert.ok("error" in checkLogoUrl("javascript:alert(1)"));
  assert.ok("error" in checkLogoUrl("logo.png"));
  assert.ok("error" in checkLogoUrl(`https://a.com/${"x".repeat(600)}`));
});

test("domains are cleaned up and checked", () => {
  const app = "app.echoboard.test";
  assert.deepEqual(normalizeDomain("https://Feedback.Acme.com/ideas", app), {
    domain: "feedback.acme.com",
  });
  assert.deepEqual(normalizeDomain("feedback.acme.com.", app), { domain: "feedback.acme.com" });
  assert.deepEqual(normalizeDomain("", app), { domain: null });
  for (const bad of ["localhost", "192.168.1.1", "-bad.acme.com", "acme", "a..com", "acme.c"]) {
    assert.ok("error" in normalizeDomain(bad, app), bad);
  }
  assert.ok("error" in normalizeDomain("APP.echoboard.test", app));
});
