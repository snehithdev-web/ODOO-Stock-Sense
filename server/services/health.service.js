import mongoose from 'mongoose';

/**
 * Mongoose connection.readyState values.
 * @see https://mongoosejs.com/docs/api/connection.html
 */
const READY_STATE = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

const UNKNOWN_READY_STATE = 'unknown';
const DB_NAME_FALLBACK = 'stocksense';

/**
 * Translate the numeric readyState into a readable status.
 * Mongoose also uses 99 ("uninitialized") before connect() is called,
 * so anything outside the four known states is reported as unknown.
 */
const getDatabaseStatus = () =>
  READY_STATE[mongoose.connection.readyState] || UNKNOWN_READY_STATE;

/**
 * Ping the database and measure the round-trip latency.
 *
 * A readyState of "connected" only means the socket is open, so the ping
 * is what separates a genuinely reachable database from a stale one.
 * Never throws: a health check must not fail by throwing.
 */
const pingDatabase = async () => {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    return { ok: false, latencyMs: null, error: 'no active connection' };
  }

  try {
    const start = process.hrtime.bigint();
    await mongoose.connection.db.admin().ping();
    const latencyMs = Number(process.hrtime.bigint() - start) / 1e6;

    return { ok: true, latencyMs: Math.round(latencyMs * 100) / 100, error: null };
  } catch (error) {
    return { ok: false, latencyMs: null, error: error.message };
  }
};

/**
 * Service to handle system health check and status reporting
 */
export const getSystemHealth = async () => {
  const dbStatus = getDatabaseStatus();
  const ping = await pingDatabase();

  // Healthy only when the connection is open *and* the database answers.
  const isHealthy = dbStatus === 'connected' && ping.ok;

  return {
    status: isHealthy ? 'ok' : 'degraded',
    message: isHealthy
      ? 'StockSense API is running'
      : 'StockSense API is running with database issues',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      name: mongoose.connection.name || DB_NAME_FALLBACK,
      latencyMs: ping.latencyMs,
      error: ping.error
    }
  };
};
