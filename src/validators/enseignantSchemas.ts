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

export type EnseignantParams = z.infer<typeof enseignantParamsSchema>;
export type ProgressionProgrammeInput = z.infer<typeof progressionProgrammeSchema>;
export type SoumettreEpreuveInput = z.infer<typeof soumettreEpreuveSchema>;
