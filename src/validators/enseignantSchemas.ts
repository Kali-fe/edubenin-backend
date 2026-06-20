import { Niveau, Serie } from "@prisma/client";
import { z } from "zod";

export const enseignantParamsSchema = z.object({
  id: z.string().cuid()
});

export const progressionProgrammeSchema = z.object({
  chapitreId: z.string().cuid(),
  traite: z.boolean(),
  dateTrait: z.coerce.date().optional()
});

export const soumettreEpreuveSchema = z.object({
  titre: z.string().min(3),
  contenu: z.string().min(10),
  niveau: z.nativeEnum(Niveau),
  serie: z.nativeEnum(Serie),
  matiereId: z.string().cuid(),
  scoreQualite: z.number().int().min(0).max(100).optional()
});

export const genererEpreuveSchema = z.object({
  matiere: z.string().min(1),
  classe: z.nativeEnum(Niveau),
  serie: z.nativeEnum(Serie),
  chapitres: z.array(z.string().min(1)).min(1),
  difficulte: z.number().int().min(1).max(10),
  type: z.string().min(1),
  duree: z.number().int().min(1)
});

export type EnseignantParams = z.infer<typeof enseignantParamsSchema>;
export type ProgressionProgrammeInput = z.infer<typeof progressionProgrammeSchema>;
export type SoumettreEpreuveInput = z.infer<typeof soumettreEpreuveSchema>;
export type GenererEpreuveInput = z.infer<typeof genererEpreuveSchema>;
