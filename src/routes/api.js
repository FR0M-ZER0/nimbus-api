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
    createParameter,
    getAllParameters,
    getParameterById,
    updateParameter,
    deleteParameter
} from '../controllers/parameterController.js'

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


// Parameters

/**
 * @swagger
 * /parameters:
 *   post:
 *     summary: Cria um novo parâmetro
 *     tags: [Parameters]
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: O ID do parâmetro a ser atualizado.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Parameter'
 *     responses:
 *       200:
 *         description: Parâmetro atualizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parameter'
 *       400:
 *         description: Erro de validação nos dados enviados.
 *       404:
 *         description: Parâmetro com o ID especificado não foi encontrado.
 *       500:
 *         description: Erro interno do servidor ao atualizar o parâmetro.
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


export default router