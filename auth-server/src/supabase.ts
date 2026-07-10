// Single shared Supabase client for the auth server. Uses the service-role
// key because this server runs entirely on the backend - it needs to read
// the admins table and write refresh_tokens regardless of any row-level
// security, and the key never reaches the browser.

import { createClient } from "@supabase/supabase-js";
import { config } from "./env";

export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey
);
