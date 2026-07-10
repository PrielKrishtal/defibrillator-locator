// Wires the auth server together and starts listening. Kept thin on purpose:
// middleware order, the router, two utility endpoints, then listen.

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./env";
import { authRouter } from "./routes";
import { verifyToken, AuthedRequest } from "./verify-token";

const app = express();

// CORS first so preflight OPTIONS requests are answered before anything else.
// credentials:true + a specific origin (not "*") is what lets the browser
// send and receive the httpOnly refresh-token cookie cross-site.
app.use(cors({ origin: config.webAppOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use(authRouter);

// Protected probe: the Next.js admin dashboard hits this to confirm the
// current access token is still valid (and to fetch who is logged in).
app.get("/me", verifyToken, (req: AuthedRequest, res) => {
  res.json({ admin: req.admin });
});

// Unauthenticated liveness check - handy for Render's health pings.
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(config.port, () => {
  console.log(`Auth server listening on port ${config.port}`);
});
