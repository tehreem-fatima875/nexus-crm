
import "server-only";

import { MongoClient, type Db } from "mongodb";

const globalWithMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};
let localClientPromise: Promise<MongoClient> | undefined;

function getClientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV !== "production" && globalWithMongo._mongoClientPromise) {
    return globalWithMongo._mongoClientPromise;
  }
  if (localClientPromise) return localClientPromise;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Please define MONGODB_URI in your root .env.local file");
  }

  const clientPromise = new MongoClient(uri, {
    connectTimeoutMS: 10_000,
    serverSelectionTimeoutMS: 12_000,
    maxPoolSize: 10,
    retryReads: true,
    retryWrites: true,
  }).connect().catch((error: unknown) => {
    localClientPromise = undefined;
    if (globalWithMongo._mongoClientPromise === clientPromise) {
      globalWithMongo._mongoClientPromise = undefined;
    }
    throw error;
  });
  localClientPromise = clientPromise;
  if (process.env.NODE_ENV !== "production") {
    globalWithMongo._mongoClientPromise = clientPromise;
  }
  return clientPromise;
}

export async function getDatabase(): Promise<Db> {
  const client = await getClientPromise();
  return client.db("nexus_crm");
}
