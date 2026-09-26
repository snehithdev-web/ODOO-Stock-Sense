/**
 * Success envelope, mirroring the { status, message } shape that
 * error.middleware.js returns for failures, so a client can branch on `status`
 * alone regardless of the outcome.
 */
export const sendSuccess = (res, { message, statusCode = 200, ...payload }) =>
  res.status(statusCode).json({ status: 'success', message, ...payload });
