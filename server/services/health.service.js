import mongoose from 'mongoose';

/**
 * Service to handle system health check and status reporting
 */
export const getSystemHealth = async () => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  return {
    status: 'ok',
    message: 'StockSense API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      name: mongoose.connection.name || 'stocksense'
    }
  };
};
