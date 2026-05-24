import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { AppError } from "../errors/AppError";
import type { JwtPayload } from "../types/auth";

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.header("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new AppError("Authentication required", 401));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    if (!decoded?.sub || !decoded?.role || !(decoded.role in Role)) {
      next(new AppError("Invalid access token", 401));
      return;
    }

    req.user = {
      userId: decoded.sub,
      role: decoded.role
    };

    next();
  } catch {
    next(new AppError("Invalid or expired access token", 401));
  }
};
