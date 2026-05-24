import { StatutEpreuve } from "@prisma/client";
import { z } from "zod";

export const epreuveStatutParamsSchema = z.object({
  id: z.string().cuid()
});

export const updateEpreuveStatutSchema = z.object({
  statut: z.nativeEnum(StatutEpreuve),
  scoreQualite: z.number().int().min(0).max(100).optional()
});

export type EpreuveStatutParams = z.infer<typeof epreuveStatutParamsSchema>;
export type UpdateEpreuveStatutInput = z.infer<typeof updateEpreuveStatutSchema>;
