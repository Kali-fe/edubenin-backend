import { z } from "zod";

export const eleveParamsSchema = z.object({
  id: z.string().cuid()
});

export const tentativeSchema = z.object({
  exerciceId: z.string().cuid(),
  reponse: z.string().min(1)
});

export type EleveParams = z.infer<typeof eleveParamsSchema>;
export type TentativeInput = z.infer<typeof tentativeSchema>;
