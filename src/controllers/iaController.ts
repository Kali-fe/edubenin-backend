import type { Request, Response } from "express";
import { Role } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { prisma } from "../lib/prisma";
import { proxyChatToIA, proxyExerciceToIA } from "../services/iaService";
import type { IAChatInput, IAExerciceInput } from "../validators/iaSchemas";

const assertEleveActor = async (requesterUserId: string, role: Role, eleveId: string): Promise<void> => {
  const eleve = await prisma.eleve.findUnique({ where: { id: eleveId }, select: { userId: true } });
  if (!eleve) {
    throw new AppError("Eleve not found", 404);
  }

  if (role === Role.ELEVE && eleve.userId !== requesterUserId) {
    throw new AppError("Forbidden", 403);
  }
};

export const postIAChat = async (
  req: Request<unknown, unknown, IAChatInput>,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  await assertEleveActor(req.user.userId, req.user.role, req.body.eleveId);

  const eleve = await prisma.eleve.findUnique({
    where: { id: req.body.eleveId },
    include: {
      user: { select: { nom: true, prenom: true } },
      progressions: {
        where: { matiereId: req.body.matiereId },
        select: { scoreGlobal: true },
        take: 1
      }
    }
  });

  if (!eleve) {
    throw new AppError("Eleve not found", 404);
  }

  const matiere = await prisma.matiere.findUnique({
    where: { id: req.body.matiereId },
    select: { id: true, nom: true }
  });
  if (!matiere) {
    throw new AppError("Matiere not found", 404);
  }

  const score = eleve.progressions[0]?.scoreGlobal ?? eleve.score;
  const nomEleve = `${eleve.user.prenom} ${eleve.user.nom}`.trim();

  const response = await proxyChatToIA({
    question: req.body.question,
    nom_eleve: nomEleve,
    niveau: eleve.niveau,
    serie: eleve.serie,
    matiere: matiere.nom,
    score,
    historique: req.body.historique
  });

  const conversation = await prisma.iAConversation.create({
    data: {
      eleveId: req.body.eleveId,
      matiereId: req.body.matiereId,
      messages: {
        create: [
          ...req.body.historique.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: req.body.question },
          { role: "assistant", content: response.reponse }
        ]
      }
    }
  });

  res.status(200).json({
    conversationId: conversation.id,
    reponse: response.reponse,
    modele: response.modele ?? "llama3.2"
  });
};

export const postIAExercice = async (
  req: Request<unknown, unknown, IAExerciceInput>,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  await assertEleveActor(req.user.userId, req.user.role, req.body.eleveId);

  const eleve = await prisma.eleve.findUnique({
    where: { id: req.body.eleveId },
    include: {
      progressions: {
        where: { matiereId: req.body.matiereId },
        select: { scoreGlobal: true },
        take: 1
      }
    }
  });
  if (!eleve) {
    throw new AppError("Eleve not found", 404);
  }

  const matiere = await prisma.matiere.findUnique({
    where: { id: req.body.matiereId },
    select: { id: true, nom: true }
  });
  if (!matiere) {
    throw new AppError("Matiere not found", 404);
  }

  const score = eleve.progressions[0]?.scoreGlobal ?? eleve.score;

  const response = await proxyExerciceToIA({
    matiere: matiere.nom,
    niveau: eleve.niveau,
    serie: eleve.serie,
    score,
    difficulte: req.body.difficulte
  });

  const log = await prisma.iAExerciceLog.create({
    data: {
      eleveId: req.body.eleveId,
      matiereId: req.body.matiereId,
      niveau: eleve.niveau,
      serie: eleve.serie,
      difficulte: response.difficulte,
      enonce: response.enonce,
      correction: response.correction
    }
  });

  res.status(200).json({
    exerciceId: log.id,
    ...response
  });
};
