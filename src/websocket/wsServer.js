import { WebSocketServer } from "ws"

let wss

export function initWebSocket(server) {
    wss = new WebSocketServer({ server })

    wss.on('connection', (ws) => {
        console.log('Cliente conectado')

        ws.send(JSON.stringify({
            type: 'INFO',
            message: 'Conectado ao ws'
        }))

        ws.on('message', (msg) => {
            try {
                const data = JSON.parse(msg)
                console.log('Mensagem recebida de cliente:', data)

                if (data.type) broadcast(data)
            } catch (err) {
                console.error('Erro ao processar mensagem WS:', err.message)
            }
        })

        ws.on('close', () => {
            console.log('Cliente desconectado')
        })
    })

    console.log('WebSocket inicializado')
}

export function broadcast(data) {
    if (!wss) return

    console.log('Enviando via Websocket: ', data)

    const payload = JSON.stringify(data)

    wss.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(payload)
        }
    })
}