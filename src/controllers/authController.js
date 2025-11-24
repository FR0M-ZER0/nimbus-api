import { PrismaClient } from "../generated/prisma/index.js";
import { loginDTO } from "../dto/authDTO.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient();

// POST /login
export const login = async (req, res) => {
  try {
    const data = loginDTO.parse(req.body);

    const usuario = await prisma.usuario.findUnique({
      where: { email: data.email },
      include: { nivel_acesso: true, estacoes: true },
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

    const token = jwt.sign(
      {
        id: usuario.id_usuario,
        role: usuario.nivel_acesso.descricao,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )

    res.status(200).json({
      token,
      user: usuarioSemSenha
    });

  } catch (error) {
    if (error.errors) {
      return res.status(400).json({ message: "Erro de validação", issues: error.format() });
    }
    console.error(error);
    res.status(500).json({ message: "Erro ao fazer login", error: error.message });
  }
};

export const me = async (req, res) => {
  try {
    const userId = req.user.id

    const user = await prisma.usuario.findUnique({
      where: { id_usuario: userId },
      include: { nivel_acesso: true, estacoes: true }
    })

    const { senha, ...noPwdUser } = user
    
    res.status(200).json(noPwdUser)
  } catch (error) {
    res.status(500).json({ message: 'Erro ao carregar perfil' })
    console.log(error)
  }
}

export const checkIfAnyUserExists = async (req, res) => {
  try {
    const users = await prisma.usuario.findMany({
      where: { id_nivel_acesso: 1 }
    })

    const exists = users.length > 0

    res.status(200).json({ exists })
  } catch(err) {
    console.error(err)
    res.status(500).json({ message: 'Não foi possível verificar se existe algum usuário.' })
  }
}