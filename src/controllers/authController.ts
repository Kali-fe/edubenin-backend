import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { AppError } from "../errors/AppError";
import { prisma } from "../lib/prisma";
import { hashToken } from "../utils/token";
import { signTokenPair } from "../utils/jwt";
import type { JwtPayload } from "../types/auth";
import type { LoginInput, RefreshInput, RegisterInput } from "../validators/authSchemas";

const toPublicUser = (user: { id: string; nom: string; prenom: string; email: string; role: Role }) => ({
  id: user.id,
  nom: user.nom,
  prenom: user.prenom,
  email: user.email,
  role: user.role
});

const persistRefreshToken = async (userId: string, refreshToken: string, expiresAt: Date): Promise<void> => {
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt
    }
  });
};

export const register = async (
  req: Request<unknown, unknown, RegisterInput>,
  res: Response
): Promise<void> => {
  const payload = req.body;

  const existing = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existing) {
    throw new AppError("Email already in use", 409);
  }

  const hashedPassword = await bcrypt.hash(payload.password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        nom: payload.nom,
        prenom: payload.prenom,
        email: payload.email,
        password: hashedPassword,
        role: Role.ELEVE
      }
    });

    if (!payload.niveau || !payload.serie) {
      throw new AppError("niveau and serie are required for ELEVE", 400);
    }

    await tx.eleve.create({
      data: {
        userId: created.id,
        niveau: payload.niveau,
        serie: payload.serie,
        etablissementId: payload.etablissementId,
        score: payload.score ?? 0
      }
    });

    return created;
  });

  const tokenPair = signTokenPair({ sub: user.id, role: user.role });
  await persistRefreshToken(user.id, tokenPair.refreshToken, tokenPair.refreshExpiresAt);

  res.status(201).json({
    user: toPublicUser(user),
    tokens: {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      tokenType: "Bearer",
      expiresIn: env.JWT_ACCESS_EXPIRES_IN
    }
  });
};

export const login = async (
  req: Request<unknown, unknown, LoginInput>,
  res: Response
): Promise<void> => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  const tokenPair = signTokenPair({ sub: user.id, role: user.role });
  await persistRefreshToken(user.id, tokenPair.refreshToken, tokenPair.refreshExpiresAt);

  res.status(200).json({
    user: toPublicUser(user),
    tokens: {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      tokenType: "Bearer",
      expiresIn: env.JWT_ACCESS_EXPIRES_IN
    }
  });
};

export const refresh = async (
  req: Request<unknown, unknown, RefreshInput>,
  res: Response
): Promise<void> => {
  const { refreshToken } = req.body;

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }

  const tokenHash = hashToken(refreshToken);
  const storedToken = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
    throw new AppError("Refresh token revoked or expired", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const tokenPair = signTokenPair({ sub: user.id, role: user.role });

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() }
    }),
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(tokenPair.refreshToken),
        expiresAt: tokenPair.refreshExpiresAt
      }
    })
  ]);

  res.status(200).json({
    user: toPublicUser(user),
    tokens: {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      tokenType: "Bearer",
      expiresIn: env.JWT_ACCESS_EXPIRES_IN
    }
  });
};
