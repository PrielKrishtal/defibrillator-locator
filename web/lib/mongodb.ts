// Shared Mongoose connection for Next.js API routes and Server Components.
//
// WHY the global cache: Next.js dev mode hot-reloads modules on every file
// change, and serverless/edge deployments can reuse the same process across
// requests. Without caching the connection on `globalThis`, each reload or
// request would open a brand new MongoDB connection instead of reusing one,
// eventually exhausting the connection pool.

import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error("Missing MONGODB_URI in web/.env");
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// WHY the cast: TypeScript doesn't know about this ad-hoc global, so we
// attach it explicitly rather than fighting the global namespace's types.
const globalForMongoose = globalThis as unknown as {
  mongooseCache?: MongooseCache;
};

const cache: MongooseCache = globalForMongoose.mongooseCache ?? {
  conn: null,
  promise: null,
};
globalForMongoose.mongooseCache = cache;

export async function connectToMongo() {
  if (cache.conn) {
    return cache.conn;
  }
  if (!cache.promise) {
    // WHY the cast: TypeScript's control-flow narrowing from the `if
    // (!mongoUri) throw` check above doesn't carry across this function
    // boundary, even though it's a module-level const that's already
    // guaranteed to be a string by the time this function ever runs.
    cache.promise = mongoose.connect(mongoUri as string);
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
