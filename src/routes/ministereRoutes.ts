import { Role } from "@prisma/client";
import { Router } from "express";
import {
  getDashboardStats,
  getEpreuvesValidation,
  updateEpreuveStatut
} from "../controllers/ministereController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireRoles } from "../middlewares/roleMiddleware";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { epreuveStatutParamsSchema, updateEpreuveStatutSchema } from "../validators/ministereSchemas";

const ministereRouter = Router();

ministereRouter.use(authMiddleware);
ministereRouter.use(requireRoles(Role.MINISTERE, Role.ADMIN));

/**
 * @route GET /ministere/dashboard/stats
 * @description Retourne les indicateurs globaux de la plateforme.
 */
ministereRouter.get("/dashboard/stats", asyncHandler(getDashboardStats));

/**
 * @route GET /ministere/epreuves/validation
 * @description Liste les epreuves en attente de validation ministerielle.
 */
ministereRouter.get("/epreuves/validation", asyncHandler(getEpreuvesValidation));

/**
 * @route PUT /ministere/epreuve/:id/statut
 * @description Met a jour le statut de validation d'une epreuve.
 */
ministereRouter.put(
  "/epreuve/:id/statut",
  validate("params", epreuveStatutParamsSchema),
  validate("body", updateEpreuveStatutSchema),
  asyncHandler(updateEpreuveStatut)
);

export { ministereRouter };
