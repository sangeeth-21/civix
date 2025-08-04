import mongoose from 'mongoose';
import { createNamespaceLogger } from './logger';

// ---
// CIVIX AGENT MODE: Bulletproof MongoDB Connection for Next.js
// 1. Always await connectDB() in every API/server function before DB ops!
// 2. Write/seed data to make DB appear in Compass.
// 3. .env.local: MONGODB_URI=mongodb://localhost:27017/civix_fInal_production
// 4. Add logs before/after DB ops for visibility.
// ---

const dbLogger = createNamespaceLogger('database');

// Use env var or fallback to local MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civix_fInal_production';

// Track connection status
let isConnected = false;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Debug: Show env and URI (sanitized)
console.debug(`[DB] NODE_ENV: ${process.env.NODE_ENV}`);
console.debug(`[DB] Raw MONGODB_URI: ${MONGODB_URI}`);
try {
  const sanitizedUri = MONGODB_URI.replace(
    /(mongodb\+srv:\/\/[^:]+:)([^@]+)(@.+)/,
    '$1*****$3'
  );
  dbLogger.info(`Using MongoDB URI: ${sanitizedUri}`);
  console.debug(`[DB] Using MongoDB URI (sanitized): ${sanitizedUri}`);
} catch (error) {
  dbLogger.warn('Could not sanitize MongoDB URI for logging');
  console.warn('[DB] Could not sanitize MongoDB URI for logging');
}

// Cache connection in global (server only)
interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}
declare global {
  // eslint-disable-next-line no-var
  var mongoose: CachedConnection | undefined;
}
const isServer = typeof window === 'undefined';
console.debug(`[DB] isServer: ${isServer}`);
const cached: CachedConnection = isServer && global.mongoose ? global.mongoose : { conn: null, promise: null };
if (isServer && !global.mongoose) {
  global.mongoose = cached;
  console.debug('[DB] Initialized global.mongoose cache');
}

// Setup listeners for connection events
function setupMongooseListeners() {
  mongoose.connection.on('connected', () => {
    isConnected = true;
    connectionAttempts = 0;
    dbLogger.info('MongoDB connected successfully');
    console.log('✅ MongoDB connected successfully');
    console.log(`[DB] Database: ${mongoose.connection.db?.databaseName || 'unknown'}`);
    console.log(`[DB] Host: ${mongoose.connection.host}`);
    console.log(`[DB] Port: ${mongoose.connection.port}`);
  });
  mongoose.connection.on('error', (error) => {
    isConnected = false;
    dbLogger.error('MongoDB connection error', { error: error.message });
    console.error('❌ MongoDB connection error:', error.message);
  });
  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    dbLogger.warn('MongoDB disconnected');
    console.warn('⚠️ MongoDB disconnected');
  });
  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    dbLogger.info('MongoDB reconnected');
    console.log('🔄 MongoDB reconnected');
  });
  mongoose.connection.on('close', () => {
    isConnected = false;
    dbLogger.info('MongoDB connection closed');
    console.log('🔒 MongoDB connection closed');
  });
}
setupMongooseListeners();

// ---
// The one function you must always await before any DB op!
async function connectDB() {
  if (!isServer) {
    console.error('[DB] Attempted to connect to DB on client side');
    throw new Error('Database connection is only available on the server side');
  }
  if (cached.conn && isConnected) {
    dbLogger.debug('Using existing database connection');
    console.debug('[DB] Using existing database connection');
    return cached.conn;
  }
  if (cached.promise) {
    console.debug('[DB] Awaiting existing connection promise');
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (error) {
      cached.promise = null;
      console.error('[DB] Error while awaiting connection promise:', error);
      throw error;
    }
  }

  // Connection options
  const opts = {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    retryWrites: true,
    retryReads: true,
  };

  dbLogger.info('Connecting to MongoDB...');
  console.log('[DB] MongoDB connection attempt - check if MongoDB is running locally');
  console.debug(`[DB] Connection options: ${JSON.stringify(opts)}`);
  const mongoUri = MONGODB_URI as string;
  console.debug(`[DB] Connecting with URI: ${mongoUri.replace(/(mongodb\+srv:\/\/[^:]+:)([^@]+)(@.+)/, '$1*****$3')}`);

  cached.promise = mongoose.connect(mongoUri, opts).then((mongooseInstance: typeof mongoose) => {
    dbLogger.info('Successfully connected to MongoDB');
    console.log('✅ MongoDB connected successfully');
    console.log(`[DB] Database: ${mongooseInstance.connection.db?.databaseName || 'unknown'}`);
    console.log(`[DB] Host: ${mongooseInstance.connection.host}`);
    console.log(`[DB] Port: ${mongooseInstance.connection.port}`);
    return mongooseInstance;
  }).catch((error: Error) => {
    connectionAttempts++;
    console.error(`❌ MongoDB connection error (attempt ${connectionAttempts}/${MAX_RECONNECT_ATTEMPTS}):`, error.message);
    dbLogger.error('MongoDB connection error', {
      error: error.message,
      attempt: connectionAttempts,
      maxAttempts: MAX_RECONNECT_ATTEMPTS,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    cached.promise = null;
    // Helpful error hints
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 MongoDB is not running. Please start MongoDB:');
      console.error('   • Windows: Start MongoDB service or run mongod');
      console.error('   • macOS: brew services start mongodb-community');
      console.error('   • Linux: sudo systemctl start mongod');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('💡 Cannot resolve MongoDB host. Check your MONGODB_URI');
    } else if (error.message.includes('Authentication failed')) {
      console.error('💡 Authentication failed. Check your MongoDB credentials');
    }
    throw error;
  });

  try {
    cached.conn = await cached.promise;
    console.debug('[DB] Database connection established and cached');
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error('[DB] Error while awaiting connection promise:', error);
    throw error;
  }
}

// ---
// Utility: Get connection status (for debugging/monitoring)
export function getConnectionStatus() {
  return {
    isConnected,
    connectionAttempts,
    databaseName: mongoose.connection.db?.databaseName,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    readyState: mongoose.connection.readyState
  };
}

// Utility: Disconnect (for tests/dev)
export async function disconnectDB() {
  if (isConnected) {
    await mongoose.connection.close();
    cached.conn = null;
    cached.promise = null;
    isConnected = false;
    console.log('🔒 MongoDB connection closed');
  }
}

// ---
// Always: await connectDB() before any DB operation in your API/server code!
export default connectDB;
