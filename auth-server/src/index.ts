// The actual entry point: takes the app built in app.ts and starts it
// listening on the real configured port. Kept separate from app.ts so
// tests can import the app without this side effect running.

import { app } from "./app";
import { config } from "./env";

app.listen(config.port, () => {
  console.log(`Auth server listening on port ${config.port}`);
});
