import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from 'bcrypt';
import { CreateUsuarioDto, UpdateUsuarioDto } from '../dto/userDTO.js';

const prisma = new PrismaClient();

class UsuarioController {
  /**
   * @swagger
   * /api/usuarios:
   *   get:
   *     summary: Obter todos os usuários
   *     tags: [Usuarios]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *     responses:
   *       200:
   *         description: Lista de usuários
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 usuarios:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Usuario'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     total:
   *                       type: integer
   *       500:
   *         description: Erro no servidor
   */
  async getAllUsuarios(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const [usuarios, total] = await Promise.all([
        prisma.usuario.findMany({
          skip,
          take: limit,
          orderBy: {
            data_criacao: 'desc'
          },
          include: {
            nivel_acesso: true
          }
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
  }

  /**
   * @swagger
   * /api/usuarios/{id}:
   *   get:
   *     summary: Obter usuário por ID
   *     tags: [Usuarios]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Dados do usuário
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Usuario'
   *       404:
   *         description: Usuário não encontrado
   *       500:
   *         description: Erro no servidor
   */
  async getUsuarioById(req, res) {
    try {

      const { id } = req.params;
      const usuario = await prisma.usuario.findUnique({
        where: { id_usuario: parseInt(id) },
        include: {
          nivel_acesso: true
        }
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json(usuario);
    } catch (error) {
      console.error('Error fetching usuario:', error);
      res.status(500).json({ error: 'Falha ao buscar usuário' });
    }
  }

  /**
   * @swagger
   * /api/usuarios:
   *   post:
   *     summary: Criar um novo usuário
   *     tags: [Usuarios]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - nome
   *               - email
   *               - senha
   *               - id_nivel_acesso
   *             properties:
   *               nome:
   *                 type: string
   *               email:
   *                 type: string
   *               senha:
   *                 type: string
   *               id_nivel_acesso:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Usuário criado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Usuario'
   *       400:
   *         description: Erro de validação
   *       409:
   *         description: Email já existe
   *       500:
   *         description: Erro no servidor
   */
  async createUsuario(req, res) {
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
      res.status(500).json({ error: 'Falha ao criar usuário' });
    }
  }

  /**
   * @swagger
   * /api/usuarios/{id}:
   *   put:
   *     summary: Atualizar usuário por ID
   *     tags: [Usuarios]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               nome:
   *                 type: string
   *               email:
   *                 type: string
   *               id_nivel_acesso:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Usuário atualizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Usuario'
   *       400:
   *         description: Erro de validação
   *       404:
   *         description: Usuário não encontrado
   *       409:
   *         description: Email já existe
   *       500:
   *         description: Erro no servidor
   */
  async updateUsuario(req, res) {
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

      // Check if email already exists (if email is being updated)
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
      res.status(500).json({ error: 'Falha ao atualizar usuário' });
    }
  }

  /**
   * @swagger
   * /api/usuarios/{id}:
   *   delete:
   *     summary: Excluir usuário por ID
   *     tags: [Usuarios]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Usuário excluído com sucesso
   *       400:
   *         description: Erro de validação
   *       404:
   *         description: Usuário não encontrado
   *       500:
   *         description: Erro no servidor
   */
  async deleteUsuario(req, res) {
    try {
      

      const { id } = req.params;

      // Check if usuario exists
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
  }
}

export default new UsuarioController();