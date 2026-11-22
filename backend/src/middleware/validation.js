import { validationResult } from 'express-validator';

export function validationError(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    next();
    return;
  }

  res.status(400).json({
    error: 'Validation failed',
    details: result.array().map((issue) => ({
      field: issue.path,
      message: issue.msg
    }))
  });
}
