import { PrismaClient } from "../generated/prisma/index.js";
import { loginDTO } from "../dto/authDTO.js";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// POST /login
export const login = async (req, res) => {
  try {
    const data = loginDTO.parse(req.body);

    const usuario = await prisma.usuario.findUnique({
      where: { email: data.email },
      include: { nivel_acesso: true },
    });

    if (!usuario) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const senhaValida = await bcrypt.compare(data.senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    if (usuario.nivel_acesso.descricao.toLowerCase() !== "administrador") {
      return res.status(403).json({ message: "Acesso negado. Usuário não é administrador." });
    }

    const { senha, ...usuarioSemSenha } = usuario;

    res.status(200).json(usuarioSemSenha);
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({ message: "Erro de validação", issues: error.format() });
    }
    console.error(error);
    res.status(500).json({ message: "Erro ao fazer login", error: error.message });
  }
};
