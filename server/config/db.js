import mongoose from 'mongoose';

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/stocksense';

/**
 * Log a message with a consistent prefix and the current database name.
 * connection.name is not populated until the connection is established,
 * so this reports "unknown" for failures that happen before that point.
 */
const log = (level, message) =>
  console[level](`[MongoDB] ${message} (db: ${mongoose.connection.name || 'unknown'})`);

/**
 * Attach connection lifecycle listeners so runtime events such as replica
 * set failover and dropped connections are surfaced instead of going unnoticed.
 */
const registerConnectionListeners = () => {
  mongoose.connection.on('connected', () => log('log', 'Connected'));
  mongoose.connection.on('disconnected', () => log('warn', 'Disconnected'));
  mongoose.connection.on('reconnected', () => log('log', 'Reconnected'));
  mongoose.connection.on('error', (error) => log('error', `Connection Error: ${error.message}`));
};

/**
 * Connects to MongoDB and returns the established Connection.
 * Rejects on failure rather than exiting, so the caller decides how to react.
 */
const connectDB = async () => {
  registerConnectionListeners();

  const conn = await mongoose.connect(process.env.MONGO_URI || DEFAULT_URI);
  log('log', `Connected: ${conn.connection.host}/${conn.connection.name}`);

  return conn;
};

export default connectDB;
