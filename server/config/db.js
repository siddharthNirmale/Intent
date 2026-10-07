import mongoose from 'mongoose';

// Global cache for serverless environments (preserves connection across warm lambda invocations)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

let lastDbError = null;

/**
 * Returns true if Mongoose has an active, ready connection to MongoDB
 */
export const getDbStatus = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Returns a user-friendly error message when database service is unreachable
 */
export const getDbErrorMessage = () => {
  return 'Service is temporarily unavailable. Please try again later.';
};

/**
 * Connect to MongoDB with serverless caching and automatic retry support
 */
const connectDB = async () => {
  // If already connected, return cached connection immediately
  if (mongoose.connection.readyState === 1) {
    lastDbError = null;
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

  const mongoUri = (process.env.MONGO_URI || '').trim();

  if (!mongoUri) {
    const error = new Error('Database connection is not configured. Please try again later.');
    lastDbError = error;
    cached.promise = null;
    cached.conn = null;
    console.warn('[MongoDB] MONGO_URI environment variable is not defined.');
    throw error;
  }

  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 10,
  };

  cached.promise = mongoose
    .connect(mongoUri, opts)
    .then((m) => {
      lastDbError = null;
      console.log(`[MongoDB] Connected: ${m.connection.host}`);
      return m.connection;
    })
    .catch((err) => {
      cached.promise = null;
      lastDbError = err;
      console.error(`[MongoDB] Connection Failed: ${err.message}`);
      throw err;
    });

  try {
    cached.conn = await cached.promise;
    lastDbError = null;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    lastDbError = error;
    console.warn(
      `[MongoDB] Server running with database offline: ${error.message}`
    );
    throw error;
  }
};

// Monitor connection events
mongoose.connection.on('connected', () => {
  lastDbError = null;
});

mongoose.connection.on('error', (err) => {
  lastDbError = err;
  console.error(`[MongoDB Runtime Error]: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB Runtime Warning]: Disconnected');
});

export default connectDB;
