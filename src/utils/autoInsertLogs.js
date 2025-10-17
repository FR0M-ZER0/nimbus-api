import WebSocket from 'ws'

const WS_URL = 'ws://localhost:3001'
const ESTACAO_ID = 'EST001'
let lastStatus = 'OFFLINE'

const ws = new WebSocket(WS_URL)

ws.on('open', () => {
    console.log('✅ Simulador conectado ao servidor WebSocket')
    sendData()
    setInterval(sendData, 15000)
})

ws.on('message', (msg) => {
    console.log('📩 Mensagem do servidor:', msg.toString())
})

ws.on('close', () => {
    console.log('🔴 Conexão encerrada com o servidor')
})

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function sendData() {
    if (ws.readyState !== WebSocket.OPEN) {
        console.warn('⚠️ WebSocket não está pronto. Ignorando envio...')
        return
    }

    lastStatus = lastStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE'
    const dataSent = randomInt(50, 500)

    const statusMessage = {
        type: 'STATUS_UPDATE',
        estacaoStatus: {
            id_estacao: ESTACAO_ID,
            status: lastStatus,
            created_at: new Date().toISOString()
        }
    }

    const logMessage = {
        type: 'LOG_UPDATE',
        estacaoLog: {
            id_estacao: ESTACAO_ID,
            data_sent: dataSent,
            created_at: new Date().toISOString()
        }
    }

    const processingMessage = {
        type: 'PROCESSING_LOG',
        dataProcessingLog: {
            id_estacao: ESTACAO_ID,
            created_at: new Date().toISOString()
        }
    }

    console.log(`\n[${new Date().toLocaleTimeString()}] Enviando dados da estação...`)
    console.log(statusMessage, logMessage, processingMessage)

    ws.send(JSON.stringify(statusMessage))
    ws.send(JSON.stringify(logMessage))
    ws.send(JSON.stringify(processingMessage))
}
