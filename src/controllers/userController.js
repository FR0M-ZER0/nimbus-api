import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from 'bcrypt';
import { CreateUsuarioDto, updatePasswordDTO, UpdateUsuarioDto } from '../dto/userDTO.js';

const prisma = new PrismaClient();

export const getAllUsuarios = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || 'data_criacao';
    const order = (req.query.order || 'desc').toLowerCase();

    const allowedSortFields = ['nome', 'data_criacao'];
    const allowedOrders = ['asc', 'desc'];

    if (!allowedSortFields.includes(sort)) {
      return res.status(400).json({ error: `Campo de ordenação inválido. Use: ${allowedSortFields.join(', ')}` });
    }

    if (!allowedOrders.includes(order)) {
      return res.status(400).json({ error: "Ordem inválida. Use 'asc' ou 'desc'" });
    }

    const skip = (page - 1) * limit;

    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        skip,
        take: limit,
        orderBy: { [sort]: order },
        include: { nivel_acesso: true }
      }),
      prisma.usuario.count()
    ]);

    res.json({
      usuarios,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching usuarios:', error);
    res.status(500).json({ error: 'Falha ao buscar usuários' });
  }
};

export const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: parseInt(id) },
      include: { nivel_acesso: true }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    console.error('Error fetching usuario:', error);
    res.status(500).json({ error: 'Falha ao buscar usuário' });
  }
};

export const createUsuario = async (req, res) => {
  try {
    const createUsuarioDto = new CreateUsuarioDto(req.body);

    // Check if email already exists
    const existingUsuario = await prisma.usuario.findUnique({
      where: { email: createUsuarioDto.email }
    });

    if (existingUsuario) {
      return res.status(409).json({ error: 'Email já existe' });
    }

    // Hash password
    const saltRounds = 10;
    const senha = await bcrypt.hash(createUsuarioDto.senha, saltRounds);

    const usuario = await prisma.usuario.create({
      data: {
        nome: createUsuarioDto.nome,
        email: createUsuarioDto.email,
        senha: senha,
        id_nivel_acesso: createUsuarioDto.id_nivel_acesso
      },
      include: {
        nivel_acesso: true
      }
    });

    // Remove password from response
    const { senha: _, ...usuarioResponse } = usuario;
    res.status(201).json(usuarioResponse);
  } catch (error) {
    console.error('Error creating usuario:', error);
    if (error.name === 'ValidationError' || error.message?.includes('validation')) {
      return res.status(400).json({ error: 'Erro de validação', details: error.message });
    }
    res.status(500).json({ error: 'Falha ao criar usuário' });
  }
};

export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const updateUsuarioDto = new UpdateUsuarioDto(req.body);

    // Check if usuario exists
    const existingUsuario = await prisma.usuario.findUnique({
      where: { id_usuario: parseInt(id) }
    });

    if (!existingUsuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Check email uniqueness if email is being updated
    if (updateUsuarioDto.email && updateUsuarioDto.email !== existingUsuario.email) {
      const emailExists = await prisma.usuario.findUnique({
        where: { email: updateUsuarioDto.email }
      });

      if (emailExists) {
        return res.status(409).json({ error: 'Email já existe' });
      }
    }

    const usuario = await prisma.usuario.update({
      where: { id_usuario: parseInt(id) },
      data: {
        nome: updateUsuarioDto.nome,
        email: updateUsuarioDto.email,
        id_nivel_acesso: updateUsuarioDto.id_nivel_acesso
      },
      include: {
        nivel_acesso: true
      }
    });

    res.json(usuario);
  } catch (error) {
    console.error('Error updating usuario:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Erro de validação', details: error.message });
    }
    res.status(500).json({ error: 'Falha ao atualizar usuário' });
  }
};

export const updateUsuarioPassword = async (req, res) => {
  try {
    const parsed = updatePasswordDTO.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Erro de validação',
        details: parsed.error.errors
      });
    }

    const { current_password, new_password, password_confirmation } = parsed.data;
    const { id } = req.params;

    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: parseInt(id) }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (new_password !== password_confirmation) {
      return res.status(400).json({ error: 'A nova senha e a confirmação não coincidem.' });
    }

    const validPassword = await bcrypt.compare(current_password, usuario.senha);
    if (!validPassword) {
      return res.status(401).json({ error: 'Senha atual incorreta.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(new_password, saltRounds);

    const updatedUsuario = await prisma.usuario.update({
      where: { id_usuario: parseInt(id) },
      data: { senha: hashedPassword },
      include: { nivel_acesso: true }
    });

    const { senha: _, ...usuarioResponse } = updatedUsuario;

    res.json({ usuarioResponse});
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Falha ao atualizar senha' });
  }
};

export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const existingUsuario = await prisma.usuario.findUnique({
      where: { id_usuario: parseInt(id) }
    });

    if (!existingUsuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    await prisma.usuario.delete({
      where: { id_usuario: parseInt(id) }
    });

    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting usuario:', error);
    res.status(500).json({ error: 'Falha ao excluir usuário' });
  }
};