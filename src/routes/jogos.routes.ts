import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authRequired, adminOnly } from "../middlewares/auth";
import { HttpError } from "../middlewares/error";

const router = Router();

const jogoInclude = {
  modalidade: { select: { id: true, nome: true, tipo: true } },
  mandante: {
    include: { curso: { select: { id: true, nome: true, sigla: true } } },
  },
  visitante: {
    include: { curso: { select: { id: true, nome: true, sigla: true } } },
  },
} as const;

router.get("/", async (req, res, next) => {
  try {
    const { modalidadeId, status, cursoId, fase } = req.query;

    const where: Record<string, unknown> = {};
    if (typeof modalidadeId === "string") where.modalidadeId = modalidadeId;
    if (typeof status === "string") where.status = status;
    if (typeof fase === "string") where.fase = fase;
    if (typeof cursoId === "string") {
      where.OR = [
        { mandante: { cursoId } },
        { visitante: { cursoId } },
      ];
    }

    const jogos = await prisma.jogo.findMany({
      where,
      include: jogoInclude,
      orderBy: { iniciaEm: "asc" },
    });
    res.json(jogos);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const jogo = await prisma.jogo.findUnique({
      where: { id: req.params.id },
      include: {
        ...jogoInclude,
        cartoes: {
          include: {
            atleta: {
              include: { user: { select: { id: true, nome: true } } },
            },
          },
        },
      },
    });
    if (!jogo) return res.status(404).json({ error: "Jogo nao encontrado" });
    res.json(jogo);
  } catch (err) {
    next(err);
  }
});

const jogoSchema = z.object({
  modalidadeId: z.string().uuid(),
  mandanteId: z.string().uuid(),
  visitanteId: z.string().uuid(),
  iniciaEm: z.coerce.date(),
  local: z.string().optional(),
  fase: z
    .enum([
      "CLASSIFICATORIA",
      "OITAVAS",
      "QUARTAS",
      "SEMIFINAL",
      "DISPUTA_TERCEIRO",
      "FINAL",
    ])
    .optional(),
  observacoes: z.string().optional(),
});

router.post("/", authRequired, adminOnly, async (req, res, next) => {
  try {
    const data = jogoSchema.parse(req.body);
    if (data.mandanteId === data.visitanteId) {
      throw new HttpError(400, "Mandante e visitante nao podem ser a mesma equipe");
    }

    const equipes = await prisma.equipe.findMany({
      where: { id: { in: [data.mandanteId, data.visitanteId] } },
    });
    if (equipes.length !== 2) throw new HttpError(404, "Equipe(s) nao encontrada(s)");
    if (equipes.some((e) => e.modalidadeId !== data.modalidadeId)) {
      throw new HttpError(
        400,
        "Equipes precisam pertencer a mesma modalidade do jogo"
      );
    }

    const jogo = await prisma.jogo.create({
      data,
      include: jogoInclude,
    });
    res.status(201).json(jogo);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", authRequired, adminOnly, async (req, res, next) => {
  try {
    const data = jogoSchema.partial().parse(req.body);
    const jogo = await prisma.jogo.update({
      where: { id: req.params.id },
      data,
      include: jogoInclude,
    });
    res.json(jogo);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authRequired, adminOnly, async (req, res, next) => {
  try {
    await prisma.jogo.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post("/:id/iniciar", authRequired, adminOnly, async (req, res, next) => {
  try {
    const jogo = await prisma.jogo.findUnique({ where: { id: req.params.id } });
    if (!jogo) throw new HttpError(404, "Jogo nao encontrado");
    if (jogo.status === "EM_ANDAMENTO")
      throw new HttpError(400, "Jogo ja esta em andamento");
    if (jogo.status === "FINALIZADO")
      throw new HttpError(400, "Jogo ja foi finalizado");

    const atualizado = await prisma.jogo.update({
      where: { id: req.params.id },
      data: {
        status: "EM_ANDAMENTO",
        iniciadoEm: new Date(),
      },
      include: jogoInclude,
    });
    res.json(atualizado);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/:id/finalizar",
  authRequired,
  adminOnly,
  async (req, res, next) => {
    try {
      const jogo = await prisma.jogo.findUnique({ where: { id: req.params.id } });
      if (!jogo) throw new HttpError(404, "Jogo nao encontrado");
      if (jogo.status === "FINALIZADO")
        throw new HttpError(400, "Jogo ja foi finalizado");

      const atualizado = await prisma.jogo.update({
        where: { id: req.params.id },
        data: {
          status: "FINALIZADO",
          finalizadoEm: new Date(),
        },
        include: jogoInclude,
      });
      res.json(atualizado);
    } catch (err) {
      next(err);
    }
  }
);

const placarSchema = z.object({
  placarMandante: z.number().int().min(0),
  placarVisitante: z.number().int().min(0),
});

router.patch("/:id/placar", authRequired, adminOnly, async (req, res, next) => {
  try {
    const data = placarSchema.parse(req.body);
    const jogo = await prisma.jogo.findUnique({ where: { id: req.params.id } });
    if (!jogo) throw new HttpError(404, "Jogo nao encontrado");
    if (jogo.status === "FINALIZADO")
      throw new HttpError(400, "Nao e possivel alterar placar de jogo finalizado");

    const atualizado = await prisma.jogo.update({
      where: { id: req.params.id },
      data,
      include: jogoInclude,
    });
    res.json(atualizado);
  } catch (err) {
    next(err);
  }
});

const cartaoSchema = z.object({
  tipo: z.enum(["AMARELO", "VERMELHO"]),
  atletaId: z.string().uuid(),
  equipeId: z.string().uuid(),
  motivo: z.string().optional(),
});

router.post("/:id/cartoes", authRequired, adminOnly, async (req, res, next) => {
  try {
    const data = cartaoSchema.parse(req.body);
    const cartao = await prisma.cartao.create({
      data: {
        ...data,
        jogoId: req.params.id,
      },
      include: {
        atleta: {
          include: { user: { select: { id: true, nome: true } } },
        },
      },
    });
    res.status(201).json(cartao);
  } catch (err) {
    next(err);
  }
});

export default router;
