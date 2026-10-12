import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import { PRIVATE_NETWORK_ERROR, postJson } from "./post";

const options = { timeoutMs: 2000, allowLocal: false };

test("refuses private addresses typed as numbers", async () => {
  for (const url of ["http://127.0.0.1:9/", "http://169.254.169.254/", "http://[::1]:9/"]) {
    await assert.rejects(postJson(new URL(url), {}, "{}", options), {
      message: PRIVATE_NETWORK_ERROR,
    });
  }
});

test("refuses names that point to a private address, at the moment it connects", async () => {
  await assert.rejects(postJson(new URL("http://localhost:9/"), {}, "{}", options), {
    message: PRIVATE_NETWORK_ERROR,
  });
});

test("posts the body and returns the status when local addresses are allowed", async () => {
  let received = "";
  const server = createServer((request, response) => {
    request.on("data", (chunk) => {
      received += chunk;
    });
    request.on("end", () => {
      response.statusCode = 204;
      response.end();
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  try {
    const status = await postJson(new URL(`http://localhost:${port}/hook`), {}, '{"a":1}', {
      timeoutMs: 2000,
      allowLocal: true,
    });
    assert.equal(status, 204);
    assert.equal(received, '{"a":1}');
  } finally {
    server.close();
  }
});
