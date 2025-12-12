/**
 * Error handling middleware
 * Provides better error messages and logging
 */

export function errorHandler(err, req, res, next) {
  console.error('Error:', {
    method: req.method,
    path: req.path,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Supabase errors
  if (err.code && err.code.startsWith('PGRST')) {
    return res.status(400).json({
      error: 'Database error',
      message: err.message,
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: err.message,
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

