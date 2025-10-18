import app from './src/index.js'
import http from 'http'
import { initWebSocket } from './src/websocket/wsServer.js'
import { startLogJob } from './src/jobs/logsJob.js'

const PORT = 3001

const server = http.createServer(app)
initWebSocket(server)
startLogJob()

server.listen(PORT, () => {
    console.log(`Server started on address ${process.env.SERVER_ADDRESS}`)
})
