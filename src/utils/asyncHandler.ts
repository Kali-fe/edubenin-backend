import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncFn<P = Record<string, string>, ResBody = unknown, ReqBody = unknown, ReqQuery = unknown> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction
) => Promise<unknown>;

export const asyncHandler = <P = Record<string, string>, ResBody = unknown, ReqBody = unknown, ReqQuery = unknown>(
  fn: AsyncFn<P, ResBody, ReqBody, ReqQuery>
): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
  return (req, res, next) => {
    void fn(req, res, next).catch(next);
  };
};
