import mongoose from 'mongoose';

const DEFAULT_MONGO_URI =
  'mongodb+srv://siddharth175nirmale1_db_user:4CidTsRkFJxfwV0x@wcc.dqy7jlw.mongodb.net/intent_compiler?retryWrites=true&w=majority';

// Global cache for serverless environments (preserves connection across warm lambda invocations)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Returns true if Mongoose has an active, ready connection to MongoDB
 */
export const getDbStatus = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Connect to MongoDB with serverless caching and automatic retry support
 */
const connectDB = async () => {
  // If already connected, return cached connection immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If connection is in progress, await the existing promise
  if (cached.promise) {
    try {
      await cached.promise;
      return mongoose.connection;
    } catch {
      cached.promise = null;
    }
  }

  const mongoUri = (process.env.MONGO_URI || DEFAULT_MONGO_URI).trim();

  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 10,
  };

  cached.promise = mongoose
    .connect(mongoUri, opts)
    .then((m) => {
      console.log(`[MongoDB] Connected: ${m.connection.host}`);
      return m.connection;
    })
    .catch((err) => {
      cached.promise = null;
      console.error(`[MongoDB] Connection Failed: ${err.message}`);
      throw err;
    });

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.warn(
      '[MongoDB] Server running with database offline. Please configure MONGO_URI or check network access.'
    );
    throw error;
  }
};

export default connectDB;

