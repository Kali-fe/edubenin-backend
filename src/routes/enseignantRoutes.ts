import { Role } from "@prisma/client";
import { Router } from "express";
import {
  getClasses,
  getEpreuves,
  postProgrammeAvancement,
  soumettreEpreuve
} from "../controllers/enseignantController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireRoles } from "../middlewares/roleMiddleware";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  enseignantParamsSchema,
  progressionProgrammeSchema,
  soumettreEpreuveSchema
} from "../validators/enseignantSchemas";

const enseignantRouter = Router();

enseignantRouter.use(authMiddleware);

/**
 * @route GET /enseignant/:id/classes
 * @description Recupere les classes d'un enseignant.
 */
enseignantRouter.get(
  "/:id/classes",
  requireRoles(Role.ENSEIGNANT, Role.MINISTERE, Role.ADMIN),
  validate("params", enseignantParamsSchema),
  asyncHandler(getClasses)
);

/**
 * @route POST /enseignant/programme/avancement
 * @description Met a jour l'avancement programme d'un enseignant.
 */
enseignantRouter.post(
  "/programme/avancement",
  requireRoles(Role.ENSEIGNANT),
  validate("body", progressionProgrammeSchema),
  asyncHandler(postProgrammeAvancement)
);

/**
 * @route POST /enseignant/epreuve/soumettre
 * @description Soumet une epreuve au workflow ministeriel.
 */
enseignantRouter.post(
  "/epreuve/soumettre",
  requireRoles(Role.ENSEIGNANT),
  validate("body", soumettreEpreuveSchema),
  asyncHandler(soumettreEpreuve)
);

/**
 * @route GET /enseignant/epreuves
 * @description Liste les epreuves soumises par l'enseignant connecte.
 */
enseignantRouter.get(
  "/epreuves",
  requireRoles(Role.ENSEIGNANT, Role.MINISTERE, Role.ADMIN),
  asyncHandler(getEpreuves)
);

export { enseignantRouter };
