import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: "ATLETA" | "ADMIN";
    }
  }
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token nao fornecido" });
  }

  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    req.userRole = payload.role;
    return next();
  } catch {
    return res.status(401).json({ error: "Token invalido ou expirado" });
  }
}

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (req.userRole !== "ADMIN") {
    return res.status(403).json({ error: "Acesso restrito a administradores" });
  }
  return next();
}
