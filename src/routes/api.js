// src/routes/api.js
import express from 'express';
import {
  getAllUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario
} from '../controllers/userController.js';
import { 
  validate, 
  createUsuarioSchema,
  updateUsuarioSchema,
  idParamSchema 
} from '../validations/userValidation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Operações relacionadas a usuários
 */

/**
 * @swagger
 * /api/user:
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
 *       - in: query
 *         name: sort
 *         description: Campo para ordenar (nome ou data_criacao)
 *         schema:
 *           type: string
 *           enum: [nome, data_criacao]
 *           default: data_criacao
 *       - in: query
 *         name: order
 *         description: Ordem de ordenação
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
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
 *                     pages:
 *                       type: integer
 *       400:
 *         description: Parâmetros de ordenação inválidos
 *       500:
 *         description: Erro no servidor
 */
router.get('/user', getAllUsuarios);

/**
 * @swagger
 * /api/user/{id}:
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
router.get('/user/:id', validate(idParamSchema), getUsuarioById);

/**
 * @swagger
 * /api/user:
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
 *                 example: "João Silva"
 *               email:
 *                 type: string
 *                 example: "joao@example.com"
 *               senha:
 *                 type: string
 *                 example: "minhasenha123"
 *               id_nivel_acesso:
 *                 type: integer
 *                 example: 1
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
router.post('/user', validate(createUsuarioSchema), createUsuario);

/**
 * @swagger
 * /api/user/{id}:
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
 *                 example: "João Atualizado"
 *               email:
 *                 type: string
 *                 example: "joao.novo@example.com"
 *               id_nivel_acesso:
 *                 type: integer
 *                 example: 2
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
router.put('/user/:id', validate(updateUsuarioSchema), updateUsuario);

/**
 * @swagger
 * /api/user/{id}:
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuário excluído com sucesso"
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.delete('/user/:id', validate(idParamSchema), deleteUsuario);

export default router;