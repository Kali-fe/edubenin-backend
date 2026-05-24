import type { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { prisma } from "../lib/prisma";
import type { EpreuveStatutParams, UpdateEpreuveStatutInput } from "../validators/ministereSchemas";

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  const [users, eleves, enseignants, epreuvesTotal, epreuvesAttente] = await Promise.all([
    prisma.user.count(),
    prisma.eleve.count(),
    prisma.enseignant.count(),
    prisma.epreuve.count(),
    prisma.epreuve.count({ where: { statut: "EN_ATTENTE" } })
  ]);

  res.status(200).json({
    users,
    eleves,
    enseignants,
    epreuves: {
      total: epreuvesTotal,
      enAttente: epreuvesAttente
    }
  });
};

export const getEpreuvesValidation = async (_req: Request, res: Response): Promise<void> => {
  const epreuves = await prisma.epreuve.findMany({
    where: { statut: "EN_ATTENTE" },
    include: {
      matiere: { select: { id: true, nom: true, code: true } },
      enseignant: {
        include: {
          user: { select: { id: true, nom: true, prenom: true, email: true } }
        }
      }
    },
    orderBy: { createdAt: "asc" }
  });

  res.status(200).json({ epreuves });
};

export const updateEpreuveStatut = async (
  req: Request<EpreuveStatutParams, unknown, UpdateEpreuveStatutInput>,
  res: Response
): Promise<void> => {
  const existing = await prisma.epreuve.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!existing) {
    throw new AppError("Epreuve not found", 404);
  }

  const updated = await prisma.epreuve.update({
    where: { id: req.params.id },
    data: {
      statut: req.body.statut,
      scoreQualite: req.body.scoreQualite
    }
  });

  res.status(200).json(updated);
};
