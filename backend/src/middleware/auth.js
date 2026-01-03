/**
 * Authentication Middleware for PRIVATE APIs
 * 
 * PRIVATE APIs require user authentication via x-user-id header
 * This ensures PDPA compliance and prevents unauthorized access to medical data
 */

export function requireAuth(req, res, next) {
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'This endpoint requires user authentication. Please provide x-user-id header.',
    });
  }
  
  // Store userId in request for use in route handlers
  req.userId = userId;
  next();
}

/**
 * Optional auth - allows anonymous access but prefers authenticated users
 */
export function optionalAuth(req, res, next) {
  const userId = req.headers['x-user-id'];
  req.userId = userId || null;
  next();
}

