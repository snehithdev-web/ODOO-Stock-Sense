import { getSystemHealth } from '../services/health.service.js';

/**
 * Controller for GET /api/health
 */
export const checkHealth = async (req, res, next) => {
  try {
    const healthData = await getSystemHealth();
    // Service stays HTTP-agnostic; the controller owns status-code mapping.
    const httpStatus = healthData.status === 'ok' ? 200 : 503;

    return res.status(httpStatus).json(healthData);
  } catch (error) {
    next(error);
  }
};
