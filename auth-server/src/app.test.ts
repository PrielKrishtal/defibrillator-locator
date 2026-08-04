// Uses node:test + built-in fetch - no new test dependency. Starts a real
// server and hits real HTTP, not the handlers directly, for an honest test.
//
// Needs a real Supabase `admins` row: auth-server/.env filled in and
// `npm run seed:admin` already run - no mocking, per this project's norm.

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
