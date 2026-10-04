import mongoose from 'mongoose';

let isConnected = false;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/intent_compiler';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
    });

    isConnected = true;
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (error) {
    isConnected = false;
    console.error(`[MongoDB] Connection Failed: ${error.message}`);
    console.warn('[MongoDB] Server will run with database offline. Please configure MONGO_URI in server/.env or start MongoDB.');
  }

  // Handle connection events
  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[MongoDB] Disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    console.log('[MongoDB] Reconnected');
  });
};

export const getDbStatus = () => isConnected;

export default connectDB;
