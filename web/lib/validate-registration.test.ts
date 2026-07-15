// Tests for the registration validation/sanitization logic. This is a pure
// function (no HTTP, no database), so these tests run instantly and don't
// need any server or .env file - each one just calls parseRegistration
// directly and checks what comes back.

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRegistration } from "./validate-registration";

test("valid input is accepted and returns the cleaned data", () => {
  const result = parseRegistration({
    firstName: "דנה",
    mobile: "0501234567",
    hasDefibrillator: true,
    hasLora: false,
  });
  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.data.firstName, "דנה");
    assert.equal(result.data.mobile, "0501234567");
  }
});

test("missing firstName is rejected", () => {
  const result = parseRegistration({
    mobile: "0501234567",
    hasDefibrillator: true,
  });
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.match(result.error, /firstName/);
  }
});

test("missing mobile is rejected", () => {
  const result = parseRegistration({
    firstName: "דנה",
    hasDefibrillator: true,
  });
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.match(result.error, /mobile/);
  }
});

test("neither hasDefibrillator nor hasLora is rejected (the §2 eligibility rule)", () => {
  const result = parseRegistration({
    firstName: "דנה",
    mobile: "0501234567",
    hasDefibrillator: false,
    hasLora: false,
  });
  assert.equal(result.valid, false);
});

test("a whitespace-only firstName is rejected, not accepted as non-empty", () => {
  const result = parseRegistration({
    firstName: "    ",
    mobile: "0501234567",
    hasDefibrillator: true,
  });
  assert.equal(result.valid, false);
});

test("an overly long firstName is truncated instead of rejected", () => {
  const veryLongName = "א".repeat(500);
  const result = parseRegistration({
    firstName: veryLongName,
    mobile: "0501234567",
    hasDefibrillator: true,
  });
  assert.equal(result.valid, true);
  if (result.valid) {
    assert.ok(
      result.data.firstName.length <= 100,
      "firstName should be capped, not stored at full length"
    );
  }
});
