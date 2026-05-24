import { Role } from "@prisma/client";
import { Router } from "express";
import {
  createTentative,
  getCours,
  getProfil,
  getProgression
} from "../controllers/eleveController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireRoles } from "../middlewares/roleMiddleware";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { eleveParamsSchema, tentativeSchema } from "../validators/eleveSchemas";

const eleveRouter = Router();

eleveRouter.use(authMiddleware);

/**
 * @route GET /eleve/:id/profil
 * @description Recupere le profil eleve avec son etablissement.
 */
eleveRouter.get(
  "/:id/profil",
  requireRoles(Role.ELEVE, Role.ENSEIGNANT, Role.MINISTERE, Role.ADMIN),
  validate("params", eleveParamsSchema),
  asyncHandler(getProfil)
);

/**
 * @route GET /eleve/:id/cours
 * @description Liste les chapitres adaptes au niveau de l'eleve.
 */
eleveRouter.get(
  "/:id/cours",
  requireRoles(Role.ELEVE, Role.ENSEIGNANT, Role.MINISTERE, Role.ADMIN),
  validate("params", eleveParamsSchema),
  asyncHandler(getCours)
);

/**
 * @route GET /eleve/:id/progression
 * @description Retourne les progressions par matiere.
 */
eleveRouter.get(
  "/:id/progression",
  requireRoles(Role.ELEVE, Role.ENSEIGNANT, Role.MINISTERE, Role.ADMIN),
  validate("params", eleveParamsSchema),
  asyncHandler(getProgression)
);

/**
 * @route POST /eleve/:id/tentative
 * @description Enregistre une tentative sur un exercice.
 */
eleveRouter.post(
  "/:id/tentative",
  requireRoles(Role.ELEVE),
  validate("params", eleveParamsSchema),
  validate("body", tentativeSchema),
  asyncHandler(createTentative)
);

export { eleveRouter };
