export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "JOIA 2026 API",
    version: "1.0.0",
    description:
      "API dos Jogos de Integracao Academica - JOIA 2026 - Unilasalle Lucas do Rio Verde",
  },
  servers: [{ url: "http://localhost:3334" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Erro: {
        type: "object",
        properties: { error: { type: "string" } },
      },
      AuthResponse: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
          token: { type: "string" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          nome: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["ATLETA", "ADMIN"] },
          cursoId: { type: "string", format: "uuid", nullable: true },
        },
      },
      Curso: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          nome: { type: "string" },
          sigla: { type: "string", nullable: true },
        },
      },
      Modalidade: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          nome: { type: "string" },
          tipo: { type: "string", enum: ["COLETIVA", "INDIVIDUAL"] },
          descricao: { type: "string", nullable: true },
          maxEquipesPorCurso: { type: "integer", nullable: true },
          maxAtletasPorCurso: { type: "integer", nullable: true },
        },
      },
      Equipe: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          nome: { type: "string" },
          genero: {
            type: "string",
            enum: ["MASCULINO", "FEMININO", "MISTO", "LIVRE"],
          },
          cursoId: { type: "string", format: "uuid" },
          modalidadeId: { type: "string", format: "uuid" },
        },
      },
      Jogo: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          modalidadeId: { type: "string", format: "uuid" },
          mandanteId: { type: "string", format: "uuid" },
          visitanteId: { type: "string", format: "uuid" },
          placarMandante: { type: "integer" },
          placarVisitante: { type: "integer" },
          status: {
            type: "string",
            enum: [
              "AGENDADO",
              "EM_ANDAMENTO",
              "FINALIZADO",
              "CANCELADO",
              "ADIADO",
            ],
          },
          fase: {
            type: "string",
            enum: [
              "CLASSIFICATORIA",
              "OITAVAS",
              "QUARTAS",
              "SEMIFINAL",
              "DISPUTA_TERCEIRO",
              "FINAL",
            ],
          },
          local: { type: "string", nullable: true },
          iniciaEm: { type: "string", format: "date-time" },
          iniciadoEm: { type: "string", format: "date-time", nullable: true },
          finalizadoEm: { type: "string", format: "date-time", nullable: true },
        },
      },
    },
  },
  security: [],
  tags: [
    { name: "Auth" },
    { name: "Users" },
    { name: "Cursos" },
    { name: "Modalidades" },
    { name: "Equipes" },
    { name: "Jogos" },
    { name: "Favoritos" },
    { name: "Ranking" },
  ],
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Cadastrar novo usuario",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nome", "email", "senha"],
                properties: {
                  nome: { type: "string" },
                  email: { type: "string", format: "email" },
                  senha: { type: "string", minLength: 6 },
                  cpf: { type: "string" },
                  telefone: { type: "string" },
                  cursoId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Criado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login com email e senha",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "senha"],
                properties: {
                  email: { type: "string", format: "email" },
                  senha: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          401: { description: "Credenciais invalidas" },
        },
      },
    },
    "/users/me": {
      get: {
        tags: ["Users"],
        summary: "Perfil do usuario autenticado",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "OK" } },
      },
      patch: {
        tags: ["Users"],
        summary: "Atualizar dados do proprio perfil",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  cpf: { type: "string" },
                  telefone: { type: "string" },
                  cursoId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/cursos": {
      get: { tags: ["Cursos"], summary: "Listar cursos", responses: { 200: { description: "OK" } } },
      post: {
        tags: ["Cursos"],
        summary: "Criar curso (admin)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nome"],
                properties: {
                  nome: { type: "string" },
                  sigla: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Criado" } },
      },
    },
    "/cursos/{id}": {
      get: {
        tags: ["Cursos"],
        summary: "Detalhes do curso",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "OK" } },
      },
      put: {
        tags: ["Cursos"],
        summary: "Editar curso (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "OK" } },
      },
      delete: {
        tags: ["Cursos"],
        summary: "Excluir curso (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 204: { description: "Sem conteudo" } },
      },
    },
    "/modalidades": {
      get: {
        tags: ["Modalidades"],
        summary: "Listar modalidades",
        responses: { 200: { description: "OK" } },
      },
      post: {
        tags: ["Modalidades"],
        summary: "Criar modalidade (admin)",
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: "Criado" } },
      },
    },
    "/modalidades/{id}": {
      get: {
        tags: ["Modalidades"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "OK" } },
      },
      put: {
        tags: ["Modalidades"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "OK" } },
      },
      delete: {
        tags: ["Modalidades"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 204: { description: "Sem conteudo" } },
      },
    },
    "/equipes": {
      get: {
        tags: ["Equipes"],
        summary: "Listar equipes",
        parameters: [
          { name: "cursoId", in: "query", schema: { type: "string" } },
          { name: "modalidadeId", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "OK" } },
      },
      post: {
        tags: ["Equipes"],
        summary: "Criar equipe (admin)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nome", "cursoId", "modalidadeId"],
                properties: {
                  nome: { type: "string" },
                  cursoId: { type: "string", format: "uuid" },
                  modalidadeId: { type: "string", format: "uuid" },
                  genero: {
                    type: "string",
                    enum: ["MASCULINO", "FEMININO", "MISTO", "LIVRE"],
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Criado" } },
      },
    },
    "/equipes/{id}": {
      get: {
        tags: ["Equipes"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/equipes/{id}/atletas": {
      post: {
        tags: ["Equipes"],
        summary: "Adicionar atleta a equipe (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId"],
                properties: {
                  userId: { type: "string", format: "uuid" },
                  numero: { type: "integer" },
                  capitao: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Criado" } },
      },
    },
    "/jogos": {
      get: {
        tags: ["Jogos"],
        summary: "Listar jogos (filtros opcionais)",
        parameters: [
          { name: "modalidadeId", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "cursoId", in: "query", schema: { type: "string" } },
          { name: "fase", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "OK" } },
      },
      post: {
        tags: ["Jogos"],
        summary: "Agendar novo jogo (admin)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["modalidadeId", "mandanteId", "visitanteId", "iniciaEm"],
                properties: {
                  modalidadeId: { type: "string", format: "uuid" },
                  mandanteId: { type: "string", format: "uuid" },
                  visitanteId: { type: "string", format: "uuid" },
                  iniciaEm: { type: "string", format: "date-time" },
                  local: { type: "string" },
                  fase: { type: "string" },
                  observacoes: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Criado" } },
      },
    },
    "/jogos/{id}": {
      get: {
        tags: ["Jogos"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "OK" } },
      },
      put: {
        tags: ["Jogos"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "OK" } },
      },
      delete: {
        tags: ["Jogos"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 204: { description: "Sem conteudo" } },
      },
    },
    "/jogos/{id}/iniciar": {
      post: {
        tags: ["Jogos"],
        summary: "Iniciar partida (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/jogos/{id}/finalizar": {
      post: {
        tags: ["Jogos"],
        summary: "Finalizar partida (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/jogos/{id}/placar": {
      patch: {
        tags: ["Jogos"],
        summary: "Lancar/atualizar placar (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["placarMandante", "placarVisitante"],
                properties: {
                  placarMandante: { type: "integer", minimum: 0 },
                  placarVisitante: { type: "integer", minimum: 0 },
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/jogos/{id}/cartoes": {
      post: {
        tags: ["Jogos"],
        summary: "Registrar cartao (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["tipo", "atletaId", "equipeId"],
                properties: {
                  tipo: { type: "string", enum: ["AMARELO", "VERMELHO"] },
                  atletaId: { type: "string", format: "uuid" },
                  equipeId: { type: "string", format: "uuid" },
                  motivo: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Criado" } },
      },
    },
    "/favoritos": {
      get: {
        tags: ["Favoritos"],
        summary: "Listar jogos favoritados pelo usuario",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/favoritos/{jogoId}": {
      post: {
        tags: ["Favoritos"],
        summary: "Favoritar um jogo",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "jogoId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { 201: { description: "Favoritado" } },
      },
      delete: {
        tags: ["Favoritos"],
        summary: "Desfavoritar",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "jogoId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { 204: { description: "Sem conteudo" } },
      },
    },
    "/ranking/modalidade/{modalidadeId}": {
      get: {
        tags: ["Ranking"],
        summary: "Tabela de pontos da modalidade",
        parameters: [
          { name: "modalidadeId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/ranking/geral": {
      get: {
        tags: ["Ranking"],
        summary: "Ranking geral de cursos (campeao do JOIA 2026)",
        responses: { 200: { description: "OK" } },
      },
    },
  },
};
