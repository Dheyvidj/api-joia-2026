# JOIA 2026 API

API dos Jogos de Integração Acadêmica - JOIA 2026 (Unilasalle Lucas do Rio Verde).

Stack: **Node + Express + TypeScript + Prisma + PostgreSQL**.

## Como rodar

```bash
# 1. Subir o postgres (porta 5433)
docker compose up -d

# 2. Instalar dependências
npm install

# 3. Gerar client + rodar migrations + popular dados
npm run prisma:migrate
npm run db:seed

# 4. Subir a API em modo dev
npm run dev
```

A API sobe em `http://localhost:3334` e o Swagger UI em `http://localhost:3334/docs`.

## Login admin (após seed)

- email: `admin@joia2026.com`
- senha: `admin123`

## Endpoints principais

| Grupo | Endpoint | Descrição |
|---|---|---|
| Auth | `POST /auth/register` | Cadastro de usuário |
| Auth | `POST /auth/login` | Login (retorna JWT) |
| Users | `GET /users/me` | Perfil do logado |
| Cursos | `GET /cursos` | Lista de cursos |
| Modalidades | `GET /modalidades` | Lista de modalidades |
| Equipes | `GET /equipes` | Filtra por curso/modalidade |
| Equipes | `POST /equipes/:id/atletas` | Adicionar atleta |
| Jogos | `GET /jogos` | Lista (com filtros) |
| Jogos | `POST /jogos/:id/iniciar` | Inicia partida |
| Jogos | `POST /jogos/:id/finalizar` | Finaliza partida |
| Jogos | `PATCH /jogos/:id/placar` | Atualiza placar |
| Jogos | `POST /jogos/:id/cartoes` | Registra cartão |
| Favoritos | `POST /favoritos/:jogoId` | Favoritar jogo |
| Ranking | `GET /ranking/geral` | Ranking de cursos |
| Ranking | `GET /ranking/modalidade/:id` | Tabela de uma modalidade |

## Modalidades cadastradas no seed

Futsal, Voleibol, Queimada, Basquete 3x3, Truco, Xadrez, Tênis de Mesa, Natação 25m, Corrida Revezamento 4x750m.

## Estrutura

```
src/
├── app.ts            # configura express
├── server.ts         # bootstrap
├── env.ts            # validação de envs com Zod
├── lib/              # prisma, jwt, openapi
├── middlewares/      # auth, error handler
└── routes/           # endpoints REST
prisma/
├── schema.prisma
└── seed.ts
```
