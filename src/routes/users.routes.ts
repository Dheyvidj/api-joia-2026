import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authRequired } from "../middlewares/auth";

const router = Router();

router.get("/me", authRequired, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        telefone: true,
        role: true,
        cursoId: true,
        curso: { select: { id: true, nome: true, sigla: true } },
        criadoEm: true,
      },
    });
    if (!user) return res.status(404).json({ error: "Usuario nao encontrado" });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

const updateMeSchema = z.object({
  nome: z.string().min(2).optional(),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  cursoId: z.string().uuid().optional(),
});

router.patch("/me", authRequired, async (req, res, next) => {
  try {
    const data = updateMeSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.userId! },
      data,
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        telefone: true,
        role: true,
        cursoId: true,
      },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
