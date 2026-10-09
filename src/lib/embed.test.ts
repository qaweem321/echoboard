import assert from "node:assert/strict";
import { test } from "node:test";
import { newBrowserVoterToken } from "./embed";
import { isVoterToken } from "./voter-token-format";

test("browser tokens match the server's token format", () => {
  for (let i = 0; i < 20; i++) {
    assert.equal(isVoterToken(newBrowserVoterToken()), true);
  }
  assert.notEqual(newBrowserVoterToken(), newBrowserVoterToken());
});
