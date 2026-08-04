// Shared Mongoose connection, cached on `globalThis`: without it, every dev
// hot-reload or serverless invocation would open a new connection instead
// of reusing one, eventually exhausting the pool.

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
    // Cast needed: TS's narrowing from the throw-check above doesn't carry
    // across this function boundary, even though it's already guaranteed.
    cache.promise = mongoose.connect(mongoUri as string);
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
