import express from 'express'
const router = express.Router()

// controllers
import { healthCheck } from '../controllers/healthCheckController.js'

// Health Check

/**
* @swagger
* /api/health:
*   get:
*     summary: Retorna o estado atual do servidor
*     responses:
*       200:
*         description: Data e horário do servidor
*/
router.get('/health', healthCheck)

export default router