import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { HttpError } from "../middlewares/error";

const router = Router();

const registerSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  cursoId: z.string().uuid().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

router.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const senhaHash = await bcrypt.hash(data.senha, 10);

    const user = await prisma.user.create({
      data: {
        nome: data.nome,
        email: data.email,
        senhaHash,
        cpf: data.cpf,
        telefone: data.telefone,
        cursoId: data.cursoId,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        cursoId: true,
      },
    });

    const token = signToken({ sub: user.id, role: user.role });
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, senha } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new HttpError(401, "Credenciais invalidas");

    const ok = await bcrypt.compare(senha, user.senhaHash);
    if (!ok) throw new HttpError(401, "Credenciais invalidas");

    const token = signToken({ sub: user.id, role: user.role });
    res.json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        cursoId: user.cursoId,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
