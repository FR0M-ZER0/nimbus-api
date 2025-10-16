import { WebSocketServer } from "ws"

let wss

export function initWebSocket(server) {
    wss = new WebSocketServer({ server })

    wss.on('connection', (ws) => {
        console.log('Cliente conectado')

        ws.send(JSON.stringify({ message: 'Conectado ao ws' }))

        ws.on('close', () => {
            console.log('Cliente desconectado')
        })
    })

    console.log('WebSocket inicializado')
}

export function broadcast(data) {
    if (!wss) return

    const payload = JSON.stringify(data)

    wss.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(payload)
        }
    })
}