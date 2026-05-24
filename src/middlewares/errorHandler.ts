import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";

interface ValidationIssue {
  path?: Array<string | number>;
  message?: string;
}

interface ValidationErrorShape {
  statusCode?: number;
  message?: string;
  details?: ValidationIssue[];
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  const maybeValidation = err as ValidationErrorShape;
  if (maybeValidation?.statusCode && maybeValidation?.message) {
    res.status(maybeValidation.statusCode).json({
      error: maybeValidation.message,
      details: maybeValidation.details ?? []
    });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
};
