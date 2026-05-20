import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authRequired, adminOnly } from "../middlewares/auth";
import { HttpError } from "../middlewares/error";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { cursoId, modalidadeId } = req.query;
    const equipes = await prisma.equipe.findMany({
      where: {
        cursoId: typeof cursoId === "string" ? cursoId : undefined,
        modalidadeId:
          typeof modalidadeId === "string" ? modalidadeId : undefined,
      },
      include: {
        curso: { select: { id: true, nome: true, sigla: true } },
        modalidade: { select: { id: true, nome: true, tipo: true } },
        _count: { select: { atletas: true } },
      },
      orderBy: [{ modalidade: { nome: "asc" } }, { curso: { nome: "asc" } }],
    });
    res.json(equipes);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const equipe = await prisma.equipe.findUnique({
      where: { id: req.params.id },
      include: {
        curso: true,
        modalidade: true,
        atletas: {
          include: {
            user: { select: { id: true, nome: true, email: true } },
          },
        },
      },
    });
    if (!equipe) return res.status(404).json({ error: "Equipe nao encontrada" });
    res.json(equipe);
  } catch (err) {
    next(err);
  }
});

const equipeSchema = z.object({
  nome: z.string().min(2),
  cursoId: z.string().uuid(),
  modalidadeId: z.string().uuid(),
  genero: z.enum(["MASCULINO", "FEMININO", "MISTO", "LIVRE"]).default("LIVRE"),
});

router.post("/", authRequired, adminOnly, async (req, res, next) => {
  try {
    const data = equipeSchema.parse(req.body);

    const modalidade = await prisma.modalidade.findUnique({
      where: { id: data.modalidadeId },
    });
    if (!modalidade) throw new HttpError(404, "Modalidade nao encontrada");

    if (modalidade.maxEquipesPorCurso) {
      const count = await prisma.equipe.count({
        where: {
          cursoId: data.cursoId,
          modalidadeId: data.modalidadeId,
        },
      });
      if (count >= modalidade.maxEquipesPorCurso) {
        throw new HttpError(
          400,
          `Curso ja atingiu o limite de ${modalidade.maxEquipesPorCurso} equipe(s) nesta modalidade`
        );
      }
    }

    const equipe = await prisma.equipe.create({ data });
    res.status(201).json(equipe);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", authRequired, adminOnly, async (req, res, next) => {
  try {
    const data = equipeSchema.partial().parse(req.body);
    const equipe = await prisma.equipe.update({
      where: { id: req.params.id },
      data,
    });
    res.json(equipe);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authRequired, adminOnly, async (req, res, next) => {
  try {
    await prisma.equipe.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

const atletaSchema = z.object({
  userId: z.string().uuid(),
  numero: z.number().int().optional(),
  capitao: z.boolean().optional(),
});

router.post("/:id/atletas", authRequired, adminOnly, async (req, res, next) => {
  try {
    const data = atletaSchema.parse(req.body);
    const atleta = await prisma.atletaEquipe.create({
      data: {
        equipeId: req.params.id,
        ...data,
      },
      include: {
        user: { select: { id: true, nome: true, email: true } },
      },
    });
    res.status(201).json(atleta);
  } catch (err) {
    next(err);
  }
});

router.delete(
  "/:id/atletas/:atletaId",
  authRequired,
  adminOnly,
  async (req, res, next) => {
    try {
      await prisma.atletaEquipe.delete({ where: { id: req.params.atletaId } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
