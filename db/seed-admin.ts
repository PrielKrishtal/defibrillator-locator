// One-off script: creates (or resets) the single seed admin account the
// assignment spec requires - username "micha", password "1234". Run with
// `npm run seed:admin` after schema.sql has been applied and db/.env is
// filled in. Never run this against the real password in a real system -
// it exists only because the assignment hands us this exact credential.

import "dotenv/config";
import bcrypt from "bcrypt";
import { createClient } from "@supabase/supabase-js";

const SEED_USERNAME = "micha";
const SEED_PASSWORD = "1234";

// WHY: fail loudly instead of letting supabase-js throw a confusing error
// deeper in the client if the .env file was never filled in.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in db/.env");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedAdmin() {
  // WHY: hash here, once, at seed time - password_hash never stores the
  // plaintext, and bcrypt bakes its own random salt into the output hash.
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  // WHY: upsert on username, not insert, so re-running this script (e.g.
  // after rotating the seed password) resets the existing row instead of
  // failing on the UNIQUE constraint or creating a duplicate admin.
  const { error } = await supabase
    .from("admins")
    .upsert(
      { username: SEED_USERNAME, password_hash: passwordHash },
      { onConflict: "username" }
    );

  if (error) {
    throw new Error(`Failed to seed admin: ${error.message}`);
  }

  console.log(`Seeded admin "${SEED_USERNAME}" with a bcrypt-hashed password.`);
}

seedAdmin();
