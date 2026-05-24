import type { Request, Response } from "express";
import { Role } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { prisma } from "../lib/prisma";
import type { EleveParams, TentativeInput } from "../validators/eleveSchemas";

const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const computeTentativeScore = (reponse: string, correction: string): number => {
  const normalizedReponse = normalizeText(reponse);
  const normalizedCorrection = normalizeText(correction);

  if (!normalizedReponse || !normalizedCorrection) {
    return 0;
  }

  if (normalizedReponse === normalizedCorrection) {
    return 100;
  }

  const expectedTokens = new Set(normalizedCorrection.split(" ").filter(Boolean));
  if (expectedTokens.size === 0) {
    return 0;
  }

  const responseTokens = new Set(normalizedReponse.split(" ").filter(Boolean));
  let matched = 0;

  for (const token of expectedTokens) {
    if (responseTokens.has(token)) {
      matched += 1;
    }
  }

  return Math.round((matched / expectedTokens.size) * 100);
};

const buildFeedback = (score: number, correction: string): string => {
  if (score >= 80) {
    return "Bonne reponse. Continue ainsi.";
  }

  if (score >= 50) {
    return `Reponse partielle. Correction attendue: ${correction}`;
  }

  return `Reponse insuffisante. Correction attendue: ${correction}`;
};

const assertEleveScope = async (requesterUserId: string, role: Role, eleveId: string): Promise<void> => {
  if (role !== Role.ELEVE) {
    return;
  }

  const eleve = await prisma.eleve.findUnique({ where: { id: eleveId }, select: { userId: true } });
  if (!eleve || eleve.userId !== requesterUserId) {
    throw new AppError("Forbidden", 403);
  }
};

export const getProfil = async (
  req: Request<EleveParams>,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  await assertEleveScope(req.user.userId, req.user.role, req.params.id);

  const eleve = await prisma.eleve.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, nom: true, prenom: true, email: true, role: true, createdAt: true } },
      etablissement: true
    }
  });

  if (!eleve) {
    throw new AppError("Eleve not found", 404);
  }

  res.status(200).json(eleve);
};

export const getCours = async (
  req: Request<EleveParams>,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  await assertEleveScope(req.user.userId, req.user.role, req.params.id);

  const eleve = await prisma.eleve.findUnique({
    where: { id: req.params.id },
    select: { niveau: true }
  });

  if (!eleve) {
    throw new AppError("Eleve not found", 404);
  }

  const chapitres = await prisma.chapitre.findMany({
    where: { niveau: eleve.niveau },
    include: {
      matiere: { select: { id: true, nom: true, code: true } }
    },
    orderBy: [{ matiere: { nom: "asc" } }, { ordre: "asc" }]
  });

  res.status(200).json({ niveau: eleve.niveau, cours: chapitres });
};

export const getProgression = async (
  req: Request<EleveParams>,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  await assertEleveScope(req.user.userId, req.user.role, req.params.id);

  const progressions = await prisma.progression.findMany({
    where: { eleveId: req.params.id },
    include: {
      matiere: { select: { id: true, nom: true, code: true } }
    },
    orderBy: { updatedAt: "desc" }
  });

  res.status(200).json({ progressions });
};

export const createTentative = async (
  req: Request<EleveParams, unknown, TentativeInput>,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  await assertEleveScope(req.user.userId, req.user.role, req.params.id);

  const eleve = await prisma.eleve.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!eleve) {
    throw new AppError("Eleve not found", 404);
  }

  const exercice = await prisma.exercice.findUnique({
    where: { id: req.body.exerciceId },
    include: { chapitre: { select: { matiereId: true } } }
  });
  if (!exercice) {
    throw new AppError("Exercice not found", 404);
  }

  const computedScore = computeTentativeScore(req.body.reponse, exercice.correction);
  const computedFeedback = buildFeedback(computedScore, exercice.correction);

  const tentative = await prisma.tentative.create({
    data: {
      eleveId: req.params.id,
      exerciceId: req.body.exerciceId,
      reponse: req.body.reponse,
      score: computedScore,
      feedback: computedFeedback
    }
  });

  const previous = await prisma.progression.findUnique({
    where: { eleveId_matiereId: { eleveId: req.params.id, matiereId: exercice.chapitre.matiereId } },
    select: { scoreGlobal: true }
  });

  const nextScore = previous ? Math.round((previous.scoreGlobal + computedScore) / 2) : computedScore;

  await prisma.progression.upsert({
    where: { eleveId_matiereId: { eleveId: req.params.id, matiereId: exercice.chapitre.matiereId } },
    update: { scoreGlobal: nextScore },
    create: {
      eleveId: req.params.id,
      matiereId: exercice.chapitre.matiereId,
      scoreGlobal: nextScore
    }
  });

  res.status(201).json(tentative);
};
