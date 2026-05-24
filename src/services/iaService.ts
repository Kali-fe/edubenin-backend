import { env } from "../config/env";
import { AppError } from "../errors/AppError";
import type { IAChatPayload, IAExercicePayload } from "../validators/iaSchemas";

interface IAChatResponse {
  reponse: string;
  modele?: string;
}

interface IAExerciceResponse {
  enonce: string;
  correction: string;
  difficulte: number;
  concepts_cles: string[];
}

const callIA = async <T>(path: string, payload: object): Promise<T> => {
  const response = await fetch(`${env.IA_SERVICE_URL}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new AppError(`IA service error: ${response.status} ${body}`, 502);
  }

  return (await response.json()) as T;
};

export const proxyChatToIA = async (payload: IAChatPayload): Promise<IAChatResponse> => {
  return callIA<IAChatResponse>("/ia/chat", payload);
};

export const proxyExerciceToIA = async (payload: IAExercicePayload): Promise<IAExerciceResponse> => {
  return callIA<IAExerciceResponse>("/ia/exercice", payload);
};
