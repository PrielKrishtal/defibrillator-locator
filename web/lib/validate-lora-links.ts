// Validates the admin-edited LoRa purchase links before they reach
// site_content. Same pattern as validate-registration.ts: a plain,
// input-in/result-out function, easy to unit test directly.

import type { LoraPurchaseLink } from "./site-content";

const MAX_LABEL_LENGTH = 100;
const MAX_URL_LENGTH = 500;
const LINK_COUNT = 3;

export type ValidationResult =
  | { valid: true; data: LoraPurchaseLink[] }
  | { valid: false; error: string };

// Takes one array entry from the parsed JSON and returns whether it has the
// shape of a link object (a `label` and a `url` property, types unchecked) -
// narrows `unknown` enough for the caller to then check both are strings.
function isRawLink(entry: unknown): entry is { label: unknown; url: unknown } {
  return typeof entry === "object" && entry !== null && "label" in entry && "url" in entry;
}

// Takes the raw PATCH body value (expected to be a JSON string encoding
// exactly 3 {label, url} objects) and returns either the sanitized links or
// a specific error - never silently drops or rewrites bad input.
export function parseLoraPurchaseLinks(raw: unknown): ValidationResult {
  if (typeof raw !== "string") {
    return { valid: false, error: "value must be a JSON string" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { valid: false, error: "value must be valid JSON" };
  }

  if (!Array.isArray(parsed) || parsed.length !== LINK_COUNT) {
    return {
      valid: false,
      error: `value must be an array of exactly ${LINK_COUNT} links`,
    };
  }

  const data: LoraPurchaseLink[] = [];
  for (const entry of parsed) {
    if (
      !isRawLink(entry) ||
      typeof entry.label !== "string" ||
      typeof entry.url !== "string"
    ) {
      return { valid: false, error: "each link must have a label and url string" };
    }

    const label = entry.label.trim();
    const url = entry.url.trim();

    if (!label) {
      return { valid: false, error: "label is required" };
    }
    if (!url) {
      return { valid: false, error: "url is required" };
    }
    if (label.length > MAX_LABEL_LENGTH) {
      return {
        valid: false,
        error: `label must be ${MAX_LABEL_LENGTH} characters or fewer`,
      };
    }
    if (url.length > MAX_URL_LENGTH) {
      return {
        valid: false,
        error: `url must be ${MAX_URL_LENGTH} characters or fewer`,
      };
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return { valid: false, error: `"${url}" is not a well-formed URL` };
    }
    // WHY an explicit allowlist, not just "new URL succeeded": javascript:
    // and data: URLs parse fine but aren't links a browser should open here.
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return { valid: false, error: `"${url}" must use http or https` };
    }

    data.push({ label, url });
  }

  return { valid: true, data };
}
