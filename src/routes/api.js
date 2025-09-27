import express from 'express'
const router = express.Router()

// controllers
import { healthCheck } from '../controllers/healthCheckController.js'

import {
    createUsuario,
    getAllUsuarios,
    deleteUsuario,
    getUsuarioById,
    updateUsuario
} from '../controllers/userController.js'

import { 
  validate, 
  createUsuarioSchema,
  updateUsuarioSchema,
  idParamSchema 
} from '../validations/userValidation.js';

import {
    createStation,
    getAllStations,
    getStationById,
    updateStation,
    deleteStation
} from '../controllers/stationController.js'

import {
    createParameter,
    getAllParameters,
    getParameterById,
    updateParameter,
    deleteParameter
} from '../controllers/parameterController.js'

import {
  createTipoParametro,
  getAllTipoParametro,
  getTipoParametroById,
  updateTipoParametro,
  deleteTipoParametro
} from "../controllers/type_ParameterController.js";


// Health Check

/**
* @swagger
* /health:
*   get:
*     summary: Retorna o estado atual do servidor
*     responses:
*       200:
*         description: Data e horário do servidor
*/
router.get('/health', healthCheck)

// Stations

/**
* @swagger
* /stations:
*   post:
*     summary: Cria uma nova estação
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               id_estacao:
*                 type: integer
*                 example: 1
*               nome:
*                 type: string
*                 example: Estação Central
*               endereco:
*                 type: string
*                 example: Rua Principal, 123
*               latitude:
*                 type: number
*                 format: float
*                 example: -23.55052
*               longitude:
*                 type: number  
*                 format: float
*                 example: -46.63342
*               id_usuario:
*                 type: integer
*                 example: 1
*     responses:
*       201:
*         description: Estação criada com sucesso
*       400:
*         description: Erro de validação
*       409:
*         description: Conflito - Estação com este id_estacao já existe
*       500:
*         description: Erro ao criar a estação
*/
router.post('/stations', createStation)
/**

/**
* @swagger
* /stations:
*   get:
*     summary: Lista todas as estações
*     responses:
*       200:
*         description: Lista de estações
*       500:
*         description: Erro ao buscar as estações
*/
router.get('/stations', getAllStations)

/**
* @swagger
* /stations/{id}:
*   get:
*     summary: Busca uma estação pelo id
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*         description: ID da estação
*     responses:
*       200:
*         description: Estação encontrada
*       404:
*         description: Estação não encontrada
*       500:
*         description: Erro ao buscar a estação
*/
router.get('/stations/:id', getStationById)

/**
* @swagger
* /stations/{id}:
*   put:
*     summary: Atualiza uma estação pelo id
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*         description: ID da estação
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties: 
*               id_estacao:
*                 type: integer
*                 example: 1
*               nome:
*                 type: string
*                 example: Estação Central
*               endereco:
*                 type: string
*                 example: Rua Principal, 123
*               latitude:
*                 type: number
*                 format: float
*                 example: -23.55052
*               longitude:
*                 type: number
*                 format: float
*                 example: -46.63342
*               id_usuario:
*                 type: integer
*                 example: 1
*     responses:
*       200:
*         description: Estação atualizada com sucesso
*       400:
*         description: Erro de validação
*       404:
*         description: Estação não encontrada
*       500:
*         description: Erro ao atualizar a estação
*/
router.put('/stations/:id', updateStation)

/**
* @swagger
* /stations/{id}:
*   delete:
*     summary: Deleta uma estação pelo id
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*         description: ID da estação
*     responses:
*       204:
*         description: Estação deletada com sucesso
*       404:
*         description: Estação não encontrada
*       500:
*         description: Erro ao deletar a estação
*/
router.delete('/stations/:id', deleteStation)
/**
// Parameters

/**
 * @swagger
 * /parameters:
 *   post:
 *     summary: Cria um novo parâmetro
 *     tags: [Parameters]

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

 *             $ref: '#/components/schemas/Parameter'
 *     responses:
 *       201:
 *         description: Parâmetro criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parameter'
 *       400:
 *         description: Erro de validação nos dados enviados.
 *       409:
 *         description: Conflito - Já existe um parâmetro com o ID fornecido.
 *       500:
 *         description: Erro interno do servidor ao criar o parâmetro.
 */
router.post('/parameters', createParameter)

/**
 * @swagger
 * /parameters:
 *   get:
 *     summary: Lista todos os parâmetros existentes
 *     tags: [Parameters]
 *     responses:
 *       200:
 *         description: Uma lista de todos os parâmetros.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Parameter'
 *       500:
 *         description: Erro interno do servidor ao buscar os parâmetros.
 */
router.get('/parameters', getAllParameters)

/**
 * @swagger
 * /parameters/{id}:
 *   get:
 *     summary: Busca um parâmetro específico pelo seu ID
 *     tags: [Parameters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: O ID do parâmetro a ser buscado.
 *     responses:
 *       200:
 *         description: Parâmetro encontrado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parameter'
 *       404:
 *         description: Parâmetro com o ID especificado não foi encontrado.
 *       500:
 *         description: Erro interno do servidor ao buscar o parâmetro.
 */
router.get('/parameters/:id', getParameterById)

/**
 * @swagger
 * /parameters/{id}:
 *   put:
 *     summary: Atualiza um parâmetro existente pelo seu ID
 *     tags: [Parameters]
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
router.put('/parameters/:id', updateParameter)

/**
 * @swagger
 * /parameters/{id}:
 *   delete:
 *     summary: Deleta um parâmetro pelo seu ID
 *     tags: [Parameters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: O ID do parâmetro a ser deletado.
 *     responses:
 *       204:
 *         description: Parâmetro deletado com sucesso (sem conteúdo no corpo da resposta).
 *       404:
 *         description: Parâmetro com o ID especificado não foi encontrado.
 *       500:
 *         description: Erro interno do servidor ao deletar o parâmetro.
 */
router.delete('/parameters/:id', deleteParameter)

router.post("/typeParameters", createTipoParametro);
router.get("/typeParameters", getAllTipoParametro);
router.get("/typeParameters/:id", getTipoParametroById);
router.put("/typeParameters/:id", updateTipoParametro);
router.delete("/typeParameters/:id", deleteTipoParametro);

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



export default router

