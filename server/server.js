// Load environment variables first so every module below can read them at import time
import './config/env.js';
import connectDB from './config/db.js';
import app from './app.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB & Start Server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[StockSense Backend] Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
};

startServer();
