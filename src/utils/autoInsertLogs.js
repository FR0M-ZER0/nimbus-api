import { PrismaClient } from "../generated/prisma/index.js"
import { broadcast } from "../websocket/wsServer.js"

const prisma = new PrismaClient()

const ESTACAO_ID = "EST001"
let lastStatus = "OFFLINE"

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

async function insertLogs() {
    try {
        lastStatus = lastStatus === "ONLINE" ? "OFFLINE" : "ONLINE"
        const dataSent = randomInt(50, 500)

        console.log(`\n[${new Date().toLocaleTimeString()}] Inserindo novos registros...`)
        console.log(`Status: ${lastStatus} | Data Sent: ${dataSent} KB`)

        const status = await prisma.estacaoStatus.create({
            data: {
                id_estacao: ESTACAO_ID,
                status: lastStatus
            }
        })

        const log = await prisma.estacaoLog.create({
            data: {
                id_estacao: ESTACAO_ID,
                data_sent: dataSent
            }
        })

        const processing = await prisma.dataProcessingLog.create({
            data: {}
        })

        const payload = {
            timestamp: new Date(),
            estacaoStatus: status,
            estacaoLog: log,
            dataProcessingLog: processing,
        }

        broadcast(payload)

        console.log("✅ Registros inseridos com sucesso!")
        console.log({
            estacaoStatusId: status.id_status,
            estacaoLogId: log.id_log,
            dataProcessingLogId: processing.id_log
        })
    } catch (error) {
        console.error("❌ Erro ao inserir registros:", error.message)
    }
}

console.log("🚀 Iniciando script de inserção automática (1 min)...")
insertLogs()

setInterval(insertLogs, 60_000)

process.on("SIGINT", async () => {
    console.log("\nEncerrando script...")
    await prisma.$disconnect()
    process.exit(0)
})
