import type { NextFunction, Request, Response } from 'express';
import { ApiError } from './error';

// Placeholder auth middleware. Spec §8.4 == TODO: wire Clerk/Lucia + JWT.
// For now it injects a dev user when NODE_ENV != production so routes can be exercised.
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (process.env.NODE_ENV === 'production' && !auth) {
    next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
    return;
  }
  // Dev injection: a stub current user.
  (req as any).user = { id: 'dev-0001', role: 'executive', name: 'Dev User' };
  next();
}

// Simple RBAC gate. Spec §5 roles.
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      next(new ApiError(403, 'FORBIDDEN', 'Insufficient role'));
      return;
    }
    next();
  };
}
