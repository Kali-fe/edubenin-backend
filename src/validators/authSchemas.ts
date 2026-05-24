import { Niveau, Role, Serie } from "@prisma/client";
import { z } from "zod";

export const registerSchema = z.object({
  nom: z.string().min(1),
  prenom: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.literal(Role.ELEVE),
  niveau: z.nativeEnum(Niveau).optional(),
  serie: z.nativeEnum(Serie).optional(),
  etablissementId: z.string().cuid().optional(),
  score: z.number().int().min(0).max(100).optional()
}).superRefine((data, ctx) => {
  if (data.role === Role.ELEVE && (!data.niveau || !data.serie)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "niveau and serie are required for ELEVE"
    });
  }
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
