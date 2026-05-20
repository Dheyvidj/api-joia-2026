/**
 * Popula o banco via API HTTP exercitando todos os endpoints principais.
 * Uso: npx tsx scripts/populate.ts
 */

const BASE = process.env.API_URL ?? "http://localhost:3334";

let adminToken = "";

type Headers = Record<string, string>;

async function api<T = any>(
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<T> {
  const headers: Headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const isConflict = res.status === 409;
    const tag = isConflict ? "DUP" : "ERR";
    console.log(`  [${tag}] ${method} ${path} -> ${res.status} ${JSON.stringify(json)}`);
    if (!isConflict) throw new Error(`HTTP ${res.status}`);
  }
  return json as T;
}

async function login(email: string, senha: string): Promise<string> {
  const out = await api<{ token: string }>("POST", "/auth/login", { email, senha });
  return out.token;
}

async function registerOrLogin(
  nome: string,
  email: string,
  senha: string,
  cursoId?: string
): Promise<{ id: string; token: string }> {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, email, senha, cursoId }),
  });
  if (res.status === 409) {
    const token = await login(email, senha);
    const me = await api<{ id: string }>("GET", "/users/me", undefined, token);
    return { id: me.id, token };
  }
  const data = await res.json();
  return { id: data.user.id, token: data.token };
}

async function findOrCreateEquipe(
  nome: string,
  cursoId: string,
  modalidadeId: string,
  genero: string
): Promise<string> {
  const equipes = await api<any[]>(
    "GET",
    `/equipes?cursoId=${cursoId}&modalidadeId=${modalidadeId}`
  );
  const existing = equipes.find((e) => e.nome === nome && e.genero === genero);
  if (existing) return existing.id;
  try {
    const created = await api<any>(
      "POST",
      "/equipes",
      { nome, cursoId, modalidadeId, genero },
      adminToken
    );
    return created.id;
  } catch {
    const refreshed = await api<any[]>(
      "GET",
      `/equipes?cursoId=${cursoId}&modalidadeId=${modalidadeId}`
    );
    return refreshed.find((e) => e.nome === nome && e.genero === genero)!.id;
  }
}

async function main() {
  console.log("Login admin...");
  adminToken = await login("admin@joia2026.com", "admin123");

  console.log("\nCarregando cursos e modalidades...");
  const cursos = await api<any[]>("GET", "/cursos");
  const modalidades = await api<any[]>("GET", "/modalidades");
  const cursoBy = (n: string) => cursos.find((c) => c.nome === n)!.id;
  const modBy = (n: string) => modalidades.find((m) => m.nome === n)!.id;

  const cursoDireito = cursoBy("Direito");
  const cursoSI = cursoBy("Sistemas de Informação");
  const cursoADM = cursoBy("Administração");
  const cursoAgro = cursoBy("Agronomia");
  const cursoVet = cursoBy("Medicina Veterinária");
  const cursoPsi = cursoBy("Psicologia");
  const cursoEngCivil = cursoBy("Engenharia Civil");
  const cursoEngProd = cursoBy("Engenharia de Produção");
  const cursoCC = cursoBy("Ciências Contábeis");

  const modFutsal = modBy("Futsal");
  const modVolei = modBy("Voleibol");
  const modBasquete = modBy("Basquete 3x3");
  const modQueimada = modBy("Queimada");
  const modTruco = modBy("Truco");
  const modXadrez = modBy("Xadrez");
  const modTM = modBy("Tênis de Mesa");

  console.log("\nCadastrando atletas...");
  const atletasInfo = [
    { nome: "Lucas Silva", email: "lucas.silva@joia.com", curso: cursoDireito },
    { nome: "Pedro Costa", email: "pedro.costa@joia.com", curso: cursoDireito },
    { nome: "Maria Souza", email: "maria.souza@joia.com", curso: cursoDireito },
    { nome: "Ana Oliveira", email: "ana.oliveira@joia.com", curso: cursoDireito },
    { nome: "Joao Pereira", email: "joao.pereira@joia.com", curso: cursoSI },
    { nome: "Rafael Mendes", email: "rafael.mendes@joia.com", curso: cursoSI },
    { nome: "Bruno Lima", email: "bruno.lima@joia.com", curso: cursoSI },
    { nome: "Carla Dias", email: "carla.dias@joia.com", curso: cursoSI },
    { nome: "Felipe Rocha", email: "felipe.rocha@joia.com", curso: cursoADM },
    { nome: "Julia Martins", email: "julia.martins@joia.com", curso: cursoADM },
    { nome: "Diego Alves", email: "diego.alves@joia.com", curso: cursoAgro },
    { nome: "Larissa Castro", email: "larissa.castro@joia.com", curso: cursoAgro },
    { nome: "Thiago Nunes", email: "thiago.nunes@joia.com", curso: cursoAgro },
    { nome: "Camila Reis", email: "camila.reis@joia.com", curso: cursoVet },
    { nome: "Marcos Vieira", email: "marcos.vieira@joia.com", curso: cursoVet },
    { nome: "Patricia Gomes", email: "patricia.gomes@joia.com", curso: cursoPsi },
    { nome: "Roberto Cruz", email: "roberto.cruz@joia.com", curso: cursoEngCivil },
    { nome: "Fernanda Pires", email: "fernanda.pires@joia.com", curso: cursoEngCivil },
    { nome: "Gustavo Faria", email: "gustavo.faria@joia.com", curso: cursoEngProd },
    { nome: "Helena Sa", email: "helena.sa@joia.com", curso: cursoCC },
  ];

  const atletas: Record<string, { id: string; token: string; curso: string }> = {};
  for (const a of atletasInfo) {
    const r = await registerOrLogin(a.nome, a.email, "atleta123", a.curso);
    atletas[a.email] = { id: r.id, token: r.token, curso: a.curso };
    console.log(`  + ${a.nome.padEnd(20)} -> ${r.id.slice(0, 8)}`);
  }

  console.log("\nCriando equipes coletivas (Futsal)...");
  const eqFutsalDireito = await findOrCreateEquipe(
    "Direito Futsal A",
    cursoDireito,
    modFutsal,
    "MASCULINO"
  );
  const eqFutsalSI = await findOrCreateEquipe("SI Futsal A", cursoSI, modFutsal, "MASCULINO");
  const eqFutsalAgro = await findOrCreateEquipe(
    "Agro Futsal A",
    cursoAgro,
    modFutsal,
    "MASCULINO"
  );
  const eqFutsalADM = await findOrCreateEquipe("ADM Futsal A", cursoADM, modFutsal, "MASCULINO");
  console.log("  4 equipes de Futsal masculino criadas");

  console.log("\nCriando equipes de Voleibol (feminino)...");
  const eqVoleiDireito = await findOrCreateEquipe(
    "Direito Volei F",
    cursoDireito,
    modVolei,
    "FEMININO"
  );
  const eqVoleiVet = await findOrCreateEquipe("Vet Volei F", cursoVet, modVolei, "FEMININO");
  const eqVoleiPsi = await findOrCreateEquipe("Psi Volei F", cursoPsi, modVolei, "FEMININO");

  console.log("\nCriando equipes Basquete 3x3...");
  const eqBasqDireito = await findOrCreateEquipe(
    "Direito Basq",
    cursoDireito,
    modBasquete,
    "MASCULINO"
  );
  const eqBasqEng = await findOrCreateEquipe(
    "Eng Civil Basq",
    cursoEngCivil,
    modBasquete,
    "MASCULINO"
  );

  console.log("\nCriando equipes Queimada...");
  const eqQueiSI = await findOrCreateEquipe("SI Queimada", cursoSI, modQueimada, "MISTO");
  const eqQueiAgro = await findOrCreateEquipe("Agro Queimada", cursoAgro, modQueimada, "MISTO");
  const eqQueiCC = await findOrCreateEquipe("CC Queimada", cursoCC, modQueimada, "MISTO");

  console.log("\nCriando duplas Truco...");
  const eqTrucoDir1 = await findOrCreateEquipe(
    "Direito Truco 1",
    cursoDireito,
    modTruco,
    "MISTO"
  );
  const eqTrucoDir2 = await findOrCreateEquipe(
    "Direito Truco 2",
    cursoDireito,
    modTruco,
    "MISTO"
  );
  const eqTrucoAgro = await findOrCreateEquipe("Agro Truco", cursoAgro, modTruco, "MISTO");

  console.log("\nCriando 'equipes' individuais (Xadrez, TM) - 1 por atleta-curso...");
  const eqXadrezDir = await findOrCreateEquipe("Xadrez Dir", cursoDireito, modXadrez, "LIVRE");
  const eqXadrezSI = await findOrCreateEquipe("Xadrez SI", cursoSI, modXadrez, "LIVRE");
  const eqTMDir = await findOrCreateEquipe("TM Dir", cursoDireito, modTM, "LIVRE");
  const eqTMADM = await findOrCreateEquipe("TM ADM", cursoADM, modTM, "LIVRE");

  console.log("\nAdicionando atletas as equipes...");
  async function addAtleta(equipeId: string, userId: string, numero?: number, capitao = false) {
    try {
      await api(
        "POST",
        `/equipes/${equipeId}/atletas`,
        { userId, numero, capitao },
        adminToken
      );
    } catch {
      /* duplicate ok */
    }
  }

  await addAtleta(eqFutsalDireito, atletas["lucas.silva@joia.com"].id, 10, true);
  await addAtleta(eqFutsalDireito, atletas["pedro.costa@joia.com"].id, 7);
  await addAtleta(eqFutsalSI, atletas["joao.pereira@joia.com"].id, 9, true);
  await addAtleta(eqFutsalSI, atletas["rafael.mendes@joia.com"].id, 11);
  await addAtleta(eqFutsalSI, atletas["bruno.lima@joia.com"].id, 5);
  await addAtleta(eqFutsalAgro, atletas["diego.alves@joia.com"].id, 8, true);
  await addAtleta(eqFutsalAgro, atletas["thiago.nunes@joia.com"].id, 6);
  await addAtleta(eqFutsalADM, atletas["felipe.rocha@joia.com"].id, 10, true);
  await addAtleta(eqVoleiDireito, atletas["maria.souza@joia.com"].id, 1, true);
  await addAtleta(eqVoleiDireito, atletas["ana.oliveira@joia.com"].id, 5);
  await addAtleta(eqVoleiVet, atletas["camila.reis@joia.com"].id, 7, true);
  await addAtleta(eqVoleiPsi, atletas["patricia.gomes@joia.com"].id, 3, true);
  await addAtleta(eqBasqDireito, atletas["lucas.silva@joia.com"].id, 23, true);
  await addAtleta(eqBasqEng, atletas["roberto.cruz@joia.com"].id, 24, true);
  await addAtleta(eqQueiSI, atletas["carla.dias@joia.com"].id);
  await addAtleta(eqQueiAgro, atletas["larissa.castro@joia.com"].id);
  await addAtleta(eqQueiCC, atletas["helena.sa@joia.com"].id);
  await addAtleta(eqTrucoDir1, atletas["maria.souza@joia.com"].id);
  await addAtleta(eqTrucoDir1, atletas["pedro.costa@joia.com"].id);
  await addAtleta(eqTrucoAgro, atletas["diego.alves@joia.com"].id);
  await addAtleta(eqXadrezDir, atletas["lucas.silva@joia.com"].id);
  await addAtleta(eqXadrezSI, atletas["rafael.mendes@joia.com"].id);
  await addAtleta(eqTMDir, atletas["ana.oliveira@joia.com"].id);
  await addAtleta(eqTMADM, atletas["julia.martins@joia.com"].id);
  console.log("  atletas vinculados");

  console.log("\nAgendando jogos...");
  async function createJogo(
    modalidadeId: string,
    mandanteId: string,
    visitanteId: string,
    iniciaEm: string,
    local = "Ginasio La Salle"
  ): Promise<string | null> {
    try {
      const j = await api<any>(
        "POST",
        "/jogos",
        { modalidadeId, mandanteId, visitanteId, iniciaEm, local },
        adminToken
      );
      return j.id;
    } catch {
      return null;
    }
  }

  const jogo1 = await createJogo(
    modFutsal,
    eqFutsalDireito,
    eqFutsalAgro,
    "2026-09-10T19:00:00Z"
  );
  const jogo2 = await createJogo(modFutsal, eqFutsalSI, eqFutsalADM, "2026-09-10T20:00:00Z");
  const jogo3 = await createJogo(
    modFutsal,
    eqFutsalDireito,
    eqFutsalSI,
    "2026-09-11T19:00:00Z"
  );
  const jogo4 = await createJogo(modFutsal, eqFutsalAgro, eqFutsalADM, "2026-09-11T20:00:00Z");
  const jogo5 = await createJogo(modVolei, eqVoleiDireito, eqVoleiVet, "2026-09-10T19:30:00Z");
  const jogo6 = await createJogo(modVolei, eqVoleiVet, eqVoleiPsi, "2026-09-11T19:30:00Z");
  const jogo7 = await createJogo(modVolei, eqVoleiDireito, eqVoleiPsi, "2026-09-12T19:30:00Z");
  const jogo8 = await createJogo(
    modBasquete,
    eqBasqDireito,
    eqBasqEng,
    "2026-09-12T20:00:00Z"
  );
  const jogo9 = await createJogo(modQueimada, eqQueiSI, eqQueiAgro, "2026-09-12T18:30:00Z");
  const jogo10 = await createJogo(modQueimada, eqQueiAgro, eqQueiCC, "2026-09-13T14:00:00Z");
  const jogo11 = await createJogo(modQueimada, eqQueiSI, eqQueiCC, "2026-09-13T15:00:00Z");
  const jogo12 = await createJogo(modTruco, eqTrucoDir1, eqTrucoAgro, "2026-09-10T21:00:00Z");
  const jogo13 = await createJogo(modTruco, eqTrucoDir2, eqTrucoAgro, "2026-09-11T21:00:00Z");
  const jogo14 = await createJogo(modXadrez, eqXadrezDir, eqXadrezSI, "2026-09-12T17:00:00Z");
  const jogo15 = await createJogo(modTM, eqTMDir, eqTMADM, "2026-09-13T16:00:00Z");

  const jogos = [
    { id: jogo1, placar: [3, 1], cartoes: [{ tipo: "AMARELO", atleta: "pedro.costa@joia.com" }] },
    { id: jogo2, placar: [2, 2] },
    { id: jogo3, placar: [4, 2] },
    { id: jogo4, placar: [0, 3] },
    { id: jogo5, placar: [2, 0] },
    { id: jogo6, placar: [2, 1] },
    { id: jogo7, placar: [2, 1] },
    { id: jogo8, placar: [21, 18] },
    { id: jogo9, placar: [5, 3] },
    { id: jogo10, placar: [4, 4] },
    { id: jogo11, placar: [6, 2] },
    { id: jogo12, placar: [12, 8] },
    { id: jogo13, placar: [10, 12] },
    { id: jogo14, placar: [1, 0] },
    { id: jogo15, placar: [3, 1] },
  ];

  console.log(`  ${jogos.filter((j) => j.id).length} jogos agendados`);

  console.log("\nIniciando e finalizando jogos com placar...");
  for (const j of jogos) {
    if (!j.id) continue;
    await api("POST", `/jogos/${j.id}/iniciar`, undefined, adminToken);
    await api(
      "PATCH",
      `/jogos/${j.id}/placar`,
      { placarMandante: j.placar[0], placarVisitante: j.placar[1] },
      adminToken
    );
    if (j.cartoes) {
      const jogoDetalhe = await api<any>("GET", `/jogos/${j.id}`);
      const mandante = await api<any>("GET", `/equipes/${jogoDetalhe.mandanteId}`);
      for (const c of j.cartoes) {
        const atletaUserId = atletas[c.atleta]?.id;
        const atletaEquipe = mandante.atletas.find((a: any) => a.user.id === atletaUserId);
        if (atletaEquipe) {
          await api(
            "POST",
            `/jogos/${j.id}/cartoes`,
            {
              tipo: c.tipo,
              atletaId: atletaEquipe.id,
              equipeId: mandante.id,
              motivo: "Falta tatica",
            },
            adminToken
          );
        }
      }
    }
    await api("POST", `/jogos/${j.id}/finalizar`, undefined, adminToken);
  }
  console.log("  jogos finalizados");

  console.log("\nDeixando 1 jogo agendado e 1 em andamento p/ teste...");
  const futuro1 = await createJogo(
    modFutsal,
    eqFutsalAgro,
    eqFutsalSI,
    "2026-09-13T18:00:00Z"
  );
  const futuro2 = await createJogo(modVolei, eqVoleiPsi, eqVoleiVet, "2026-09-13T19:00:00Z");
  if (futuro2) {
    await api("POST", `/jogos/${futuro2}/iniciar`, undefined, adminToken);
    await api(
      "PATCH",
      `/jogos/${futuro2}/placar`,
      { placarMandante: 1, placarVisitante: 0 },
      adminToken
    );
  }
  console.log(`  agendado: ${futuro1?.slice(0, 8)}  em andamento: ${futuro2?.slice(0, 8)}`);

  console.log("\nAtletas favoritando jogos...");
  const todosJogos = await api<any[]>("GET", "/jogos");
  for (const email of [
    "lucas.silva@joia.com",
    "maria.souza@joia.com",
    "joao.pereira@joia.com",
    "camila.reis@joia.com",
  ]) {
    const token = atletas[email].token;
    const escolhidos = todosJogos.slice(0, 3 + Math.floor(Math.random() * 3));
    for (const j of escolhidos) {
      await api("POST", `/favoritos/${j.id}`, undefined, token);
    }
  }
  console.log("  favoritos criados");

  console.log("\n========================================");
  console.log("RESUMO");
  console.log("========================================");
  const stats = {
    cursos: (await api<any[]>("GET", "/cursos")).length,
    modalidades: (await api<any[]>("GET", "/modalidades")).length,
    equipes: (await api<any[]>("GET", "/equipes")).length,
    jogos: (await api<any[]>("GET", "/jogos")).length,
    finalizados: (await api<any[]>("GET", "/jogos?status=FINALIZADO")).length,
    em_andamento: (await api<any[]>("GET", "/jogos?status=EM_ANDAMENTO")).length,
    agendados: (await api<any[]>("GET", "/jogos?status=AGENDADO")).length,
  };
  console.table(stats);

  console.log("\nRanking geral:");
  const ranking = await api<any[]>("GET", "/ranking/geral");
  console.table(ranking.filter((r) => r.pontos > 0));

  console.log("\nTabela do Futsal:");
  const tabelaFutsal = await api<{ tabela: any[] }>(
    "GET",
    `/ranking/modalidade/${modFutsal}`
  );
  console.table(
    tabelaFutsal.tabela.map((t) => ({
      equipe: t.equipe,
      curso: t.curso.sigla,
      J: t.jogos,
      V: t.vitorias,
      E: t.empates,
      D: t.derrotas,
      GP: t.golsPro,
      GC: t.golsContra,
      SG: t.saldo,
      Pts: t.pontos,
    }))
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
