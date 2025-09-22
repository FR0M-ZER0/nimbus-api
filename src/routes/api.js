import express from 'express'
const router = express.Router()

// controllers
import { healthCheck } from '../controllers/healthCheckController.js'
import {
    createStation,
    getAllStations,
    getStationById,
    updateStation,
    deleteStation
} from '../controllers/stationController.js'
import {
    createUsuario,
    getAllUsuarios,
    getUsuarioById,
    updateUsuario,
    deleteUsuario
} from '../controllers/userController.js'

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

// Usuarios (Users)

/**
* @swagger
* /usuarios:
*   post:
*     summary: Cria um novo usuário
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
*                 example: João Silva
*               email:
*                 type: string
*                 example: joao@email.com
*               senha:
*                 type: string
*                 example: senha123
*               id_nivel_acesso:
*                 type: integer
*                 example: 1
*     responses:
*       201:
*         description: Usuário criado com sucesso
*       400:
*         description: Erro de validação
*       409:
*         description: Conflito - Email já existe
*       500:
*         description: Erro ao criar o usuário
*/
router.post('/usuarios', createUsuario)

/**
* @swagger
* /usuarios:
*   get:
*     summary: Lista todos os usuários
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
*                     type: object
*                     properties:
*                       id_usuario:
*                         type: integer
*                       nome:
*                         type: string
*                       email:
*                         type: string
*                       id_nivel_acesso:
*                         type: integer
*                       data_criacao:
*                         type: string
*                         format: date-time
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
*         description: Erro ao buscar os usuários
*/
router.get('/usuarios', getAllUsuarios)

/**
* @swagger
* /usuarios/{id}:
*   get:
*     summary: Busca um usuário pelo id
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*         description: ID do usuário
*     responses:
*       200:
*         description: Usuário encontrado
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 id_usuario:
*                   type: integer
*                 nome:
*                   type: string
*                 email:
*                   type: string
*                 id_nivel_acesso:
*                   type: integer
*                 data_criacao:
*                   type: string
*                   format: date-time
*       404:
*         description: Usuário não encontrado
*       500:
*         description: Erro ao buscar o usuário
*/
router.get('/usuarios/:id', getUsuarioById)

/**
* @swagger
* /usuarios/{id}:
*   put:
*     summary: Atualiza um usuário pelo id
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*         description: ID do usuário
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               nome:
*                 type: string
*                 example: João Silva
*               email:
*                 type: string
*                 example: joao@email.com
*               id_nivel_acesso:
*                 type: integer
*                 example: 1
*     responses:
*       200:
*         description: Usuário atualizado com sucesso
*       400:
*         description: Erro de validação
*       404:
*         description: Usuário não encontrado
*       409:
*         description: Conflito - Email já existe
*       500:
*         description: Erro ao atualizar o usuário
*/
router.put('/usuarios/:id', updateUsuario)

/**
* @swagger
* /usuarios/{id}:
*   delete:
*     summary: Deleta um usuário pelo id
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*         description: ID do usuário
*     responses:
*       200:
*         description: Usuário deletado com sucesso
*       404:
*         description: Usuário não encontrado
*       500:
*         description: Erro ao deletar o usuário
*/
router.delete('/usuarios/:id', deleteUsuario)

export default router