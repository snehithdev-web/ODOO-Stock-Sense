import { getSystemHealth } from '../services/health.service.js';

/**
 * Controller for GET /api/health
 */
export const checkHealth = async (req, res, next) => {
  try {
    const healthData = await getSystemHealth();
    return res.status(200).json(healthData);
  } catch (error) {
    next(error);
  }
};
