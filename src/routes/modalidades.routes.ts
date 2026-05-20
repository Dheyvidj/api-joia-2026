import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authRequired, adminOnly } from "../middlewares/auth";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const modalidades = await prisma.modalidade.findMany({
      orderBy: { nome: "asc" },
    });
    res.json(modalidades);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const modalidade = await prisma.modalidade.findUnique({
      where: { id: req.params.id },
      include: {
        equipes: {
          include: { curso: { select: { nome: true, sigla: true } } },
        },
        _count: { select: { jogos: true, equipes: true } },
      },
    });
    if (!modalidade)
      return res.status(404).json({ error: "Modalidade nao encontrada" });
    res.json(modalidade);
  } catch (err) {
    next(err);
  }
});

const modalidadeSchema = z.object({
  nome: z.string().min(2),
  tipo: z.enum(["COLETIVA", "INDIVIDUAL"]),
  descricao: z.string().optional(),
  maxEquipesPorCurso: z.number().int().positive().optional(),
  maxAtletasPorCurso: z.number().int().positive().optional(),
});

router.post("/", authRequired, adminOnly, async (req, res, next) => {
  try {
    const data = modalidadeSchema.parse(req.body);
    const modalidade = await prisma.modalidade.create({ data });
    res.status(201).json(modalidade);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", authRequired, adminOnly, async (req, res, next) => {
  try {
    const data = modalidadeSchema.partial().parse(req.body);
    const modalidade = await prisma.modalidade.update({
      where: { id: req.params.id },
      data,
    });
    res.json(modalidade);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authRequired, adminOnly, async (req, res, next) => {
  try {
    await prisma.modalidade.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
