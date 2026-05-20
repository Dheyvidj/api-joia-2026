import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authRequired } from "../middlewares/auth";

const router = Router();

router.get("/", authRequired, async (req, res, next) => {
  try {
    const favoritos = await prisma.favorito.findMany({
      where: { userId: req.userId! },
      include: {
        jogo: {
          include: {
            modalidade: { select: { nome: true, tipo: true } },
            mandante: {
              include: { curso: { select: { nome: true, sigla: true } } },
            },
            visitante: {
              include: { curso: { select: { nome: true, sigla: true } } },
            },
          },
        },
      },
      orderBy: { criadoEm: "desc" },
    });
    res.json(favoritos);
  } catch (err) {
    next(err);
  }
});

router.post("/:jogoId", authRequired, async (req, res, next) => {
  try {
    const favorito = await prisma.favorito.upsert({
      where: {
        userId_jogoId: {
          userId: req.userId!,
          jogoId: req.params.jogoId,
        },
      },
      update: {},
      create: {
        userId: req.userId!,
        jogoId: req.params.jogoId,
      },
    });
    res.status(201).json(favorito);
  } catch (err) {
    next(err);
  }
});

router.delete("/:jogoId", authRequired, async (req, res, next) => {
  try {
    await prisma.favorito.deleteMany({
      where: {
        userId: req.userId!,
        jogoId: req.params.jogoId,
      },
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
