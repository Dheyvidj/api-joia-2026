import { PrismaClient, TipoModalidade, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const cursos = [
    { nome: "Direito", sigla: "DIR" },
    { nome: "Administração", sigla: "ADM" },
    { nome: "Sistemas de Informação", sigla: "SI" },
    { nome: "Engenharia Civil", sigla: "ENG-CIV" },
    { nome: "Engenharia de Produção", sigla: "ENG-PROD" },
    { nome: "Agronomia", sigla: "AGRO" },
    { nome: "Medicina Veterinária", sigla: "VET" },
    { nome: "Psicologia", sigla: "PSI" },
    { nome: "Pedagogia", sigla: "PED" },
    { nome: "Ciências Contábeis", sigla: "CC" },
    { nome: "Colégio La Salle", sigla: "EM" },
  ];

  for (const c of cursos) {
    await prisma.curso.upsert({
      where: { nome: c.nome },
      update: {},
      create: c,
    });
  }

  const modalidades = [
    {
      nome: "Futsal",
      tipo: TipoModalidade.COLETIVA,
      descricao: "Dois tempos de 10 minutos cada, regras CBFS",
      maxEquipesPorCurso: 2,
    },
    {
      nome: "Voleibol",
      tipo: TipoModalidade.COLETIVA,
      descricao: "Regras oficiais CBV",
      maxEquipesPorCurso: 2,
    },
    {
      nome: "Queimada",
      tipo: TipoModalidade.COLETIVA,
      descricao: "1 tempo de 15 minutos corridos",
      maxEquipesPorCurso: 2,
    },
    {
      nome: "Basquete 3x3",
      tipo: TipoModalidade.COLETIVA,
      descricao: "3 jogadores + 1 reserva, meia quadra, 10 minutos corridos ou 21 pontos",
      maxEquipesPorCurso: 2,
    },
    {
      nome: "Truco",
      tipo: TipoModalidade.COLETIVA,
      descricao: "Disputado em duplas (masc, fem ou mistas)",
      maxEquipesPorCurso: 4,
    },
    {
      nome: "Xadrez",
      tipo: TipoModalidade.INDIVIDUAL,
      descricao: "Convencional (Pensado) - 30 min por jogador, regras FIDE/CBX",
      maxAtletasPorCurso: 4,
    },
    {
      nome: "Tênis de Mesa",
      tipo: TipoModalidade.INDIVIDUAL,
      descricao: "Melhor de 3 sets de 11 pontos, regras ITTF/CBTM",
      maxAtletasPorCurso: 2,
    },
    {
      nome: "Natação 25m",
      tipo: TipoModalidade.INDIVIDUAL,
      descricao: "Nado livre 25 metros",
      maxAtletasPorCurso: 6,
    },
    {
      nome: "Corrida Revezamento 4x750m",
      tipo: TipoModalidade.COLETIVA,
      descricao: "4 atletas (2 masc + 2 fem) - Corrida Campus Unilasalle",
      maxEquipesPorCurso: 1,
    },
  ];

  for (const m of modalidades) {
    await prisma.modalidade.upsert({
      where: { nome: m.nome },
      update: m,
      create: m,
    });
  }

  const adminEmail = "admin@joia2026.com";
  const senhaHash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      nome: "Administrador JOIA",
      email: adminEmail,
      senhaHash,
      role: Role.ADMIN,
    },
  });

  console.log("Seed concluido.");
  console.log("Admin login: admin@joia2026.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
