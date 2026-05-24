import { Role } from "@prisma/client";
import { Router } from "express";
import { postIAChat, postIAExercice } from "../controllers/iaController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireRoles } from "../middlewares/roleMiddleware";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { iaChatSchema, iaExerciceSchema } from "../validators/iaSchemas";

const iaRouter = Router();

iaRouter.use(authMiddleware);

/**
 * @route POST /ia/chat
 * @description Proxy securise vers le endpoint IA de chat pedagogique FastAPI.
 */
iaRouter.post(
  "/chat",
  requireRoles(Role.ELEVE, Role.ENSEIGNANT, Role.MINISTERE, Role.ADMIN),
  validate("body", iaChatSchema),
  asyncHandler(postIAChat)
);

/**
 * @route POST /ia/exercice
 * @description Proxy securise vers le endpoint IA de generation d'exercice FastAPI.
 */
iaRouter.post(
  "/exercice",
  requireRoles(Role.ELEVE, Role.ENSEIGNANT, Role.MINISTERE, Role.ADMIN),
  validate("body", iaExerciceSchema),
  asyncHandler(postIAExercice)
);

export { iaRouter };
