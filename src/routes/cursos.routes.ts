import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authRequired, adminOnly } from "../middlewares/auth";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const cursos = await prisma.curso.findMany({
      orderBy: { nome: "asc" },
    });
    res.json(cursos);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const curso = await prisma.curso.findUnique({
      where: { id: req.params.id },
      include: {
        equipes: {
          include: { modalidade: { select: { nome: true, tipo: true } } },
        },
        _count: { select: { users: true, equipes: true } },
      },
    });
    if (!curso) return res.status(404).json({ error: "Curso nao encontrado" });
    res.json(curso);
  } catch (err) {
    next(err);
  }
});

const cursoSchema = z.object({
  nome: z.string().min(2),
  sigla: z.string().optional(),
});

router.post("/", authRequired, adminOnly, async (req, res, next) => {
  try {
    const data = cursoSchema.parse(req.body);
    const curso = await prisma.curso.create({ data });
    res.status(201).json(curso);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", authRequired, adminOnly, async (req, res, next) => {
  try {
    const data = cursoSchema.partial().parse(req.body);
    const curso = await prisma.curso.update({
      where: { id: req.params.id },
      data,
    });
    res.json(curso);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authRequired, adminOnly, async (req, res, next) => {
  try {
    await prisma.curso.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
