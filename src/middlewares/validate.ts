import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

type RequestTarget = "body" | "params" | "query";

export const validate = <T>(target: RequestTarget, schema: ZodSchema<T>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req[target]);

    if (!parsed.success) {
      next({
        statusCode: 400,
        message: "Validation error",
        details: parsed.error.issues
      });
      return;
    }

    (req as unknown as Record<RequestTarget, T>)[target] = parsed.data;
    next();
  };
};
