// One-off script: creates/resets the seed admin ("micha" / "1234", per the
// assignment spec). Run `npm run seed:admin` after schema.sql + db/.env.

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

  // Upsert, not insert, so re-running this resets the row instead of
  // hitting the UNIQUE constraint.
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
