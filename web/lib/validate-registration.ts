// Sanitizes and validates a registration submission before it ever reaches
// the database. Kept as a plain function (no NextRequest/NextResponse) so
// it's a pure input-in, result-out function - easy to unit test directly,
// and easy to reuse if another route ever needs the same rules.

// WHY cap lengths at all: without a limit, someone could submit a
// megabyte-long "first name" - harmless on its own, but wasted storage and
// a cheap way to abuse a public, unauthenticated endpoint.
const MAX_NAME_LENGTH = 100;
const MAX_MOBILE_LENGTH = 20;
const MAX_LORA_ID_LENGTH = 50;

export type RegistrationInput = {
  firstName?: unknown;
  lastName?: unknown;
  mobile?: unknown;
  loraId?: unknown;
  hasDefibrillator?: unknown;
  hasLora?: unknown;
};

export type SanitizedRegistration = {
  firstName: string;
  lastName: string;
  mobile: string;
  loraId: string;
  hasDefibrillator: boolean;
  hasLora: boolean;
};

export type ValidationResult =
  | { valid: true; data: SanitizedRegistration }
  | { valid: false; error: string };

// WHY trim then cap, not the other way around: trimming first means
// leading/trailing spaces don't eat into the length budget, so a name that
// just barely fits isn't unfairly truncated because of whitespace.
function sanitizeString(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export function parseRegistration(input: RegistrationInput): ValidationResult {
  const firstName = sanitizeString(input.firstName, MAX_NAME_LENGTH);
  const lastName = sanitizeString(input.lastName, MAX_NAME_LENGTH);
  const mobile = sanitizeString(input.mobile, MAX_MOBILE_LENGTH);
  const loraId = sanitizeString(input.loraId, MAX_LORA_ID_LENGTH);
  const hasDefibrillator = Boolean(input.hasDefibrillator);
  const hasLora = Boolean(input.hasLora);

  // WHY check the sanitized value, not the raw input: a name that's only
  // whitespace (e.g. "   ") should fail as "required", not pass just
  // because the raw string was non-empty before trimming.
  if (!firstName) {
    return { valid: false, error: "firstName is required" };
  }
  if (!mobile) {
    return { valid: false, error: "mobile is required" };
  }
  // WHY this check: §2's eligibility rule is "defibrillator owner (with or
  // without LoRa) OR LoRa-only owner" - someone with neither isn't a valid
  // registrant for this system.
  if (!hasDefibrillator && !hasLora) {
    return {
      valid: false,
      error: "Must have a defibrillator, a LoRa device, or both",
    };
  }

  return {
    valid: true,
    data: { firstName, lastName, mobile, loraId, hasDefibrillator, hasLora },
  };
}
