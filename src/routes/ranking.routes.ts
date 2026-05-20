import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

const PONTOS_POR_COLOCACAO: Record<number, number> = {
  1: 5,
  2: 4,
  3: 3,
  4: 2,
  5: 1,
};

router.get("/modalidade/:modalidadeId", async (req, res, next) => {
  try {
    const modalidade = await prisma.modalidade.findUnique({
      where: { id: req.params.modalidadeId },
    });
    if (!modalidade)
      return res.status(404).json({ error: "Modalidade nao encontrada" });

    const equipes = await prisma.equipe.findMany({
      where: { modalidadeId: req.params.modalidadeId },
      include: {
        curso: { select: { id: true, nome: true, sigla: true } },
        jogosMandante: { where: { status: "FINALIZADO" } },
        jogosVisitante: { where: { status: "FINALIZADO" } },
      },
    });

    const tabela = equipes.map((equipe) => {
      let vitorias = 0;
      let empates = 0;
      let derrotas = 0;
      let golsPro = 0;
      let golsContra = 0;

      for (const j of equipe.jogosMandante) {
        golsPro += j.placarMandante;
        golsContra += j.placarVisitante;
        if (j.placarMandante > j.placarVisitante) vitorias++;
        else if (j.placarMandante < j.placarVisitante) derrotas++;
        else empates++;
      }
      for (const j of equipe.jogosVisitante) {
        golsPro += j.placarVisitante;
        golsContra += j.placarMandante;
        if (j.placarVisitante > j.placarMandante) vitorias++;
        else if (j.placarVisitante < j.placarMandante) derrotas++;
        else empates++;
      }

      const jogos = vitorias + empates + derrotas;
      const pontos = vitorias * 3 + empates * 1;

      return {
        equipeId: equipe.id,
        equipe: equipe.nome,
        curso: equipe.curso,
        jogos,
        vitorias,
        empates,
        derrotas,
        golsPro,
        golsContra,
        saldo: golsPro - golsContra,
        pontos,
      };
    });

    tabela.sort(
      (a, b) =>
        b.pontos - a.pontos ||
        b.vitorias - a.vitorias ||
        b.saldo - a.saldo ||
        b.golsPro - a.golsPro
    );

    res.json({ modalidade, tabela });
  } catch (err) {
    next(err);
  }
});

router.get("/geral", async (_req, res, next) => {
  try {
    const cursos = await prisma.curso.findMany();
    const modalidades = await prisma.modalidade.findMany({
      include: {
        equipes: {
          include: {
            curso: true,
            jogosMandante: { where: { status: "FINALIZADO" } },
            jogosVisitante: { where: { status: "FINALIZADO" } },
          },
        },
      },
    });

    const pontosPorCurso = new Map<string, number>();
    for (const c of cursos) pontosPorCurso.set(c.id, 0);

    for (const modalidade of modalidades) {
      const stats = modalidade.equipes.map((equipe) => {
        let vitorias = 0;
        let empates = 0;
        let golsPro = 0;
        let golsContra = 0;
        for (const j of equipe.jogosMandante) {
          golsPro += j.placarMandante;
          golsContra += j.placarVisitante;
          if (j.placarMandante > j.placarVisitante) vitorias++;
          else if (j.placarMandante === j.placarVisitante) empates++;
        }
        for (const j of equipe.jogosVisitante) {
          golsPro += j.placarVisitante;
          golsContra += j.placarMandante;
          if (j.placarVisitante > j.placarMandante) vitorias++;
          else if (j.placarVisitante === j.placarMandante) empates++;
        }
        return {
          cursoId: equipe.cursoId,
          pontos: vitorias * 3 + empates,
          vitorias,
          saldo: golsPro - golsContra,
          golsPro,
        };
      });

      stats.sort(
        (a, b) =>
          b.pontos - a.pontos ||
          b.vitorias - a.vitorias ||
          b.saldo - a.saldo ||
          b.golsPro - a.golsPro
      );

      stats.slice(0, 5).forEach((s, idx) => {
        const colocacao = idx + 1;
        const pts = PONTOS_POR_COLOCACAO[colocacao] ?? 0;
        pontosPorCurso.set(
          s.cursoId,
          (pontosPorCurso.get(s.cursoId) ?? 0) + pts
        );
      });
    }

    const ranking = cursos
      .map((c) => ({
        cursoId: c.id,
        nome: c.nome,
        sigla: c.sigla,
        pontos: pontosPorCurso.get(c.id) ?? 0,
      }))
      .sort((a, b) => b.pontos - a.pontos);

    res.json(ranking);
  } catch (err) {
    next(err);
  }
});

export default router;
