import type { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';
import { ApiError } from './error';

// Validate a request key against a Zod schema. On failure, throw ApiError(VALIDATION_ERROR).
export function validate<T>(schema: ZodType<T>, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      next(new ApiError(400, 'VALIDATION_ERROR', 'Validation failed', details));
      return;
    }
    // Attach parsed value back onto the request for the controller.
    (req as any).validated = { ...((req as any).validated ?? {}), [source]: result.data };
    next();
  };
}
