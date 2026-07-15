// Tests for the auth server. Uses Node's built-in test runner (node:test)
// and its built-in fetch - no new test framework or HTTP-assertion library
// needed, since Node already ships both.
//
// WHY start a real server instead of calling route handlers directly: this
// exercises the actual HTTP layer (status codes, JSON parsing, cookies)
// exactly as a real client would hit it, not just the function bodies in
// isolation - a more honest test of "does /login actually work."
//
// WHY these tests need real credentials: /login and its success/failure
// cases talk to the real Supabase `admins` table, the same one the deployed
// app uses. There's no mock database here - these tests only pass with
// auth-server/.env filled in and `npm run seed:admin` already run in db/
// (see README). That's a deliberate simplification: mocking Supabase would
// need its own setup, and this project already treats "run against the real
// configured services" as its normal way of testing (see README's Testing
// note).

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import { app } from "./app";

let server: Server;
let baseUrl: string;

// WHY listen on port 0: that tells the OS "give me any free port," so
// these tests never clash with a real dev server already running on 4000.
before(() => {
  return new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(() => {
  return new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

test("GET /health returns 200 with an ok status", async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, "ok");
});

test("POST /login without a username or password returns 400", async () => {
  const res = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 400);
});

test("POST /login with the wrong password returns 401", async () => {
  const res = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "micha", password: "not-the-real-password" }),
  });
  assert.equal(res.status, 401);
});

test("POST /login with the seed admin's real credentials returns an access token and sets the refresh cookie", async () => {
  const res = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "micha", password: "1234" }),
  });
  assert.equal(res.status, 200);

  const body = await res.json();
  assert.ok(body.accessToken, "response should include an accessToken");

  const setCookie = res.headers.get("set-cookie");
  assert.ok(
    setCookie?.includes("refreshToken="),
    "response should set a refreshToken cookie"
  );
});
