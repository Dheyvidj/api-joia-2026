import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Dados invalidos",
      issues: err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        error: "Registro duplicado",
        target: err.meta?.target,
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Registro nao encontrado" });
    }
  }

  if (err instanceof Error) {
    const status = (err as Error & { status?: number }).status ?? 500;
    return res.status(status).json({ error: err.message });
  }

  return res.status(500).json({ error: "Erro interno" });
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
