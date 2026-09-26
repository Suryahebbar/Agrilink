import mongoose from 'mongoose';
import dns from 'dns';

// Ensure DNS lookups for MongoDB Atlas SRV work reliably on Windows/ISP networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  console.warn('DNS server setting skipped:', e);
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not set. Please add it to your .env.local file.');
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Use a global cache so we don't create multiple connections in dev / hot-reload
const globalWithMongoose = global as typeof global & {
  _mongoose?: MongooseCache;
};

const cached: MongooseCache = globalWithMongoose._mongoose || {
  conn: null,
  promise: null,
};

if (!globalWithMongoose._mongoose) {
  globalWithMongoose._mongoose = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!, {
      serverSelectionTimeoutMS: 8000,
    }).then((mongooseInstance) => {
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null;
      cached.conn = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    throw err;
  }
}
