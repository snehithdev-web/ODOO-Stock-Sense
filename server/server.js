// Load environment variables first so every module below can read them at import time
import './config/env.js';
import connectDB from './config/db.js';
import mongoose from 'mongoose';
import app from './app.js';

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  await connectDB();

  server = app.listen(PORT, () => {
    console.log(
      `[StockSense Backend] Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`
    );
  });
};

/**
 * Close the HTTP listener and the Mongo connection before exiting, so a
 * nodemon restart or a Ctrl+C does not leave sockets and connection handles
 * behind.
 */
const shutdown = async (signal) => {
  console.log(`\n[StockSense Backend] ${signal} received, shutting down...`);

  const forceExit = setTimeout(() => {
    console.error('[StockSense Backend] Shutdown timed out, forcing exit.');
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.connection.close();
    clearTimeout(forceExit);
    console.log('[StockSense Backend] Shutdown complete.');
    process.exit(0);
  } catch (error) {
    console.error('[StockSense Backend] Error during shutdown:', error);
    process.exit(1);
  }
};

// Node 18+ terminates on an unhandled rejection with exit code 1 and no output
// of its own, which makes a stray async failure indistinguishable from a
// manual kill. Log the reason first so the cause is never lost.
process.on('unhandledRejection', (reason) => {
  console.error('[StockSense Backend] Unhandled promise rejection:', reason);
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  console.error('[StockSense Backend] Uncaught exception:', error);
  process.exit(1);
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer().catch((error) => {
  console.error('[StockSense Backend] Failed to start:', error);
  process.exit(1);
});
