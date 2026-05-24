import { Router } from "express";
import { login, refresh, register } from "../controllers/authController";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middlewares/validate";
import { loginSchema, refreshSchema, registerSchema } from "../validators/authSchemas";

const authRouter = Router();

/**
 * @route POST /auth/register
 * @description Cree un utilisateur et son profil metier.
 */
authRouter.post("/register", validate("body", registerSchema), asyncHandler(register));

/**
 * @route POST /auth/login
 * @description Authentifie un utilisateur et retourne les tokens JWT.
 */
authRouter.post("/login", validate("body", loginSchema), asyncHandler(login));

/**
 * @route POST /auth/refresh
 * @description Renouvelle la paire de tokens via refresh token valide.
 */
authRouter.post("/refresh", validate("body", refreshSchema), asyncHandler(refresh));

export { authRouter };
