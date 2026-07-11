// Shared Supabase client for Next.js API routes. Uses the service-role key
// because these routes run only on the server (Route Handlers, never
// shipped to the browser) and need to read/write registrations regardless
// of row-level security.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// WHY throw here, not return null: every route that imports this expects a
// working client. Failing at import time (server startup / first request)
// is clearer than a null-check scattered across every route file.
if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in web/.env"
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
