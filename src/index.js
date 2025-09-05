import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import router from './routes/api.js'
import swaggerUi from 'swagger-ui-express'
import { swaggerDocs } from './config/swagger.js'

const app = express()

app.use(express.json())
app.use(cors({
    origin: process.env.CLIENT_ADDRESS,
    credentials: true
}))
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))
app.use('/api', router)

export default app