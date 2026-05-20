-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ATLETA', 'ADMIN');

-- CreateEnum
CREATE TYPE "TipoModalidade" AS ENUM ('COLETIVA', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "Genero" AS ENUM ('MASCULINO', 'FEMININO', 'MISTO', 'LIVRE');

-- CreateEnum
CREATE TYPE "StatusJogo" AS ENUM ('AGENDADO', 'EM_ANDAMENTO', 'FINALIZADO', 'CANCELADO', 'ADIADO');

-- CreateEnum
CREATE TYPE "FaseCampeonato" AS ENUM ('CLASSIFICATORIA', 'OITAVAS', 'QUARTAS', 'SEMIFINAL', 'DISPUTA_TERCEIRO', 'FINAL');

-- CreateEnum
CREATE TYPE "TipoCartao" AS ENUM ('AMARELO', 'VERMELHO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "cpf" TEXT,
    "telefone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'ATLETA',
    "cursoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Curso" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT,

    CONSTRAINT "Curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modalidade" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoModalidade" NOT NULL,
    "descricao" TEXT,
    "maxEquipesPorCurso" INTEGER,
    "maxAtletasPorCurso" INTEGER,

    CONSTRAINT "Modalidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipe" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "genero" "Genero" NOT NULL DEFAULT 'LIVRE',
    "modalidadeId" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Equipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtletaEquipe" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "equipeId" TEXT NOT NULL,
    "numero" INTEGER,
    "capitao" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AtletaEquipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jogo" (
    "id" TEXT NOT NULL,
    "modalidadeId" TEXT NOT NULL,
    "mandanteId" TEXT NOT NULL,
    "visitanteId" TEXT NOT NULL,
    "placarMandante" INTEGER NOT NULL DEFAULT 0,
    "placarVisitante" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusJogo" NOT NULL DEFAULT 'AGENDADO',
    "fase" "FaseCampeonato" NOT NULL DEFAULT 'CLASSIFICATORIA',
    "local" TEXT,
    "iniciaEm" TIMESTAMP(3) NOT NULL,
    "iniciadoEm" TIMESTAMP(3),
    "finalizadoEm" TIMESTAMP(3),
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Jogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorito" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jogoId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cartao" (
    "id" TEXT NOT NULL,
    "tipo" "TipoCartao" NOT NULL,
    "jogoId" TEXT NOT NULL,
    "atletaId" TEXT NOT NULL,
    "equipeId" TEXT NOT NULL,
    "motivo" TEXT,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cartao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");

-- CreateIndex
CREATE INDEX "User_cursoId_idx" ON "User"("cursoId");

-- CreateIndex
CREATE UNIQUE INDEX "Curso_nome_key" ON "Curso"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Modalidade_nome_key" ON "Modalidade"("nome");

-- CreateIndex
CREATE INDEX "Equipe_cursoId_idx" ON "Equipe"("cursoId");

-- CreateIndex
CREATE INDEX "Equipe_modalidadeId_idx" ON "Equipe"("modalidadeId");

-- CreateIndex
CREATE UNIQUE INDEX "Equipe_modalidadeId_cursoId_nome_genero_key" ON "Equipe"("modalidadeId", "cursoId", "nome", "genero");

-- CreateIndex
CREATE UNIQUE INDEX "AtletaEquipe_userId_equipeId_key" ON "AtletaEquipe"("userId", "equipeId");

-- CreateIndex
CREATE INDEX "Jogo_modalidadeId_idx" ON "Jogo"("modalidadeId");

-- CreateIndex
CREATE INDEX "Jogo_status_idx" ON "Jogo"("status");

-- CreateIndex
CREATE INDEX "Jogo_iniciaEm_idx" ON "Jogo"("iniciaEm");

-- CreateIndex
CREATE UNIQUE INDEX "Favorito_userId_jogoId_key" ON "Favorito"("userId", "jogoId");

-- CreateIndex
CREATE INDEX "Cartao_jogoId_idx" ON "Cartao"("jogoId");

-- CreateIndex
CREATE INDEX "Cartao_atletaId_idx" ON "Cartao"("atletaId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipe" ADD CONSTRAINT "Equipe_modalidadeId_fkey" FOREIGN KEY ("modalidadeId") REFERENCES "Modalidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipe" ADD CONSTRAINT "Equipe_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtletaEquipe" ADD CONSTRAINT "AtletaEquipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtletaEquipe" ADD CONSTRAINT "AtletaEquipe_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogo" ADD CONSTRAINT "Jogo_modalidadeId_fkey" FOREIGN KEY ("modalidadeId") REFERENCES "Modalidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogo" ADD CONSTRAINT "Jogo_mandanteId_fkey" FOREIGN KEY ("mandanteId") REFERENCES "Equipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogo" ADD CONSTRAINT "Jogo_visitanteId_fkey" FOREIGN KEY ("visitanteId") REFERENCES "Equipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "Jogo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cartao" ADD CONSTRAINT "Cartao_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "Jogo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cartao" ADD CONSTRAINT "Cartao_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "AtletaEquipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cartao" ADD CONSTRAINT "Cartao_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
