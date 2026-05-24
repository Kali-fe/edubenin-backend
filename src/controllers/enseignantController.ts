import type { Request, Response } from "express";
import { Role, StatutEpreuve } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { prisma } from "../lib/prisma";
import type {
  EnseignantParams,
  ProgressionProgrammeInput,
  SoumettreEpreuveInput
} from "../validators/enseignantSchemas";

const assertEnseignantScope = async (requesterUserId: string, role: Role, enseignantId: string): Promise<void> => {
  if (role !== Role.ENSEIGNANT) {
    return;
  }

  const enseignant = await prisma.enseignant.findUnique({
    where: { id: enseignantId },
    select: { userId: true }
  });

  if (!enseignant || enseignant.userId !== requesterUserId) {
    throw new AppError("Forbidden", 403);
  }
};

export const getClasses = async (
  req: Request<EnseignantParams>,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  await assertEnseignantScope(req.user.userId, req.user.role, req.params.id);

  const classes = await prisma.classe.findMany({
    where: { enseignantId: req.params.id },
    include: {
      etablissement: true,
      eleves: {
        include: {
          eleve: {
            include: {
              user: { select: { id: true, nom: true, prenom: true, email: true } }
            }
          }
        }
      }
    },
    orderBy: { nom: "asc" }
  });

  res.status(200).json({ classes });
};

export const postProgrammeAvancement = async (
  req: Request<unknown, unknown, ProgressionProgrammeInput>,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const enseignant = await prisma.enseignant.findUnique({ where: { userId: req.user.userId } });
  if (!enseignant) {
    throw new AppError("Enseignant profile not found", 404);
  }

  const progression = await prisma.progressionProgramme.upsert({
    where: {
      enseignantId_chapitreId: {
        enseignantId: enseignant.id,
        chapitreId: req.body.chapitreId
      }
    },
    update: {
      traite: req.body.traite,
      dateTrait: req.body.traite ? (req.body.dateTrait ?? new Date()) : null
    },
    create: {
      enseignantId: enseignant.id,
      chapitreId: req.body.chapitreId,
      traite: req.body.traite,
      dateTrait: req.body.traite ? (req.body.dateTrait ?? new Date()) : null
    }
  });

  res.status(200).json(progression);
};

export const soumettreEpreuve = async (
  req: Request<unknown, unknown, SoumettreEpreuveInput>,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const enseignant = await prisma.enseignant.findUnique({ where: { userId: req.user.userId } });
  if (!enseignant) {
    throw new AppError("Enseignant profile not found", 404);
  }

  const epreuve = await prisma.epreuve.create({
    data: {
      titre: req.body.titre,
      contenu: req.body.contenu,
      niveau: req.body.niveau,
      serie: req.body.serie,
      matiereId: req.body.matiereId,
      enseignantId: enseignant.id,
      statut: StatutEpreuve.EN_ATTENTE,
      scoreQualite: req.body.scoreQualite
    }
  });

  res.status(201).json(epreuve);
};

export const getEpreuves = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  let enseignantId: string | undefined;

  if (req.user.role === Role.ENSEIGNANT) {
    const enseignant = await prisma.enseignant.findUnique({ where: { userId: req.user.userId } });
    if (!enseignant) {
      throw new AppError("Enseignant profile not found", 404);
    }
    enseignantId = enseignant.id;
  }

  const epreuves = await prisma.epreuve.findMany({
    where: enseignantId ? { enseignantId } : undefined,
    include: {
      matiere: { select: { id: true, nom: true, code: true } },
      enseignant: {
        select: {
          id: true,
          user: { select: { id: true, nom: true, prenom: true, email: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  res.status(200).json({ epreuves });
};
