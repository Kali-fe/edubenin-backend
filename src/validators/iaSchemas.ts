import { Niveau, Serie } from "@prisma/client";
import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1)
});

export const iaChatSchema = z.object({
  eleveId: z.string().cuid(),
  question: z.string().min(1),
  matiereId: z.string().cuid(),
  historique: z.array(messageSchema).default([])
});

export const iaExerciceSchema = z.object({
  eleveId: z.string().cuid(),
  matiereId: z.string().cuid(),
  difficulte: z.number().int().min(1).max(10)
});

export type IAChatInput = z.infer<typeof iaChatSchema>;
export type IAExerciceInput = z.infer<typeof iaExerciceSchema>;

export interface IAChatPayload {
  question: string;
  nom_eleve: string;
  niveau: Niveau;
  serie: Serie;
  matiere: string;
  score: number;
  historique: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface IAExercicePayload {
  matiere: string;
  niveau: Niveau;
  serie: Serie;
  score: number;
  difficulte: number;
  chapitres?: string[];
  type?: string;
  duree?: number;
}
