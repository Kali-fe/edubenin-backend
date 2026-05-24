import "dotenv/config";
import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { authRouter } from "./routes/authRoutes";
import { eleveRouter } from "./routes/eleveRoutes";
import { enseignantRouter } from "./routes/enseignantRoutes";
import { ministereRouter } from "./routes/ministereRoutes";
import { iaRouter } from "./routes/iaRoutes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "edubenin-backend" });
});

app.use("/auth", authRouter);
app.use("/eleve", eleveRouter);
app.use("/enseignant", enseignantRouter);
app.use("/ministere", ministereRouter);
app.use("/ia", iaRouter);

app.use(errorHandler);

export { app };
