import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import { openapiSpec } from "./lib/swagger";
import { errorHandler } from "./middlewares/error";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/users.routes";
import cursosRoutes from "./routes/cursos.routes";
import modalidadesRoutes from "./routes/modalidades.routes";
import equipesRoutes from "./routes/equipes.routes";
import jogosRoutes from "./routes/jogos.routes";
import favoritosRoutes from "./routes/favoritos.routes";
import rankingRoutes from "./routes/ranking.routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: "JOIA 2026 API",
    version: "1.0.0",
    docs: "/docs",
    health: "/health",
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.get("/openapi.json", (_req, res) => res.json(openapiSpec));

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/cursos", cursosRoutes);
app.use("/modalidades", modalidadesRoutes);
app.use("/equipes", equipesRoutes);
app.use("/jogos", jogosRoutes);
app.use("/favoritos", favoritosRoutes);
app.use("/ranking", rankingRoutes);

app.use((_req, res) => res.status(404).json({ error: "Rota nao encontrada" }));
app.use(errorHandler);
