/**
 * Mongoose and MongoDB errors that are caused by the request rather than by a
 * server fault, and so must not be reported as 500.
 */
const CLIENT_ERROR_STATUS = {
  // A document failed schema validation, for example an out of range quantity
  // or an enum value that does not exist.
  ValidationError: 400,
  // A value could not be cast to the schema type. Almost always a malformed
  // ObjectId in a URL parameter, such as /api/products/not-an-id.
  CastError: 400
};

/**
 * Works out the response status for an error, in priority order:
 *   1. an explicit statusCode, which is how ApiError from the service layer
 *      communicates 404 / 409 and friends
 *   2. a known Mongoose client error
 *   3. whatever the handler set on the response
 *   4. 500
 */
const resolveErrorStatus = (err, res) => {
  if (err.statusCode) return err.statusCode;

  const mapped = CLIENT_ERROR_STATUS[err.name];
  if (mapped) return mapped;

  return res.statusCode === 200 ? 500 : res.statusCode;
};

// Express identifies an error handler by its arity, so the unused fourth
// argument has to stay even though nothing calls it. The underscore keeps the
// linter from reporting it.
export const errorHandler = (err, req, res, _next) => {
  const statusCode = resolveErrorStatus(err, res);

  // Anything at 5xx is our fault, so it gets logged in full on the server.
  // The response body deliberately never carries a stack trace: the previous
  // version leaked Mongo and Mongoose internals to the browser in every
  // non-production environment.
  if (statusCode >= 500) {
    console.error(`[Error] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
};
