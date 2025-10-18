import cron from "node-cron"
import { PrismaClient } from "../generated/prisma/index.js"
import { broadcast } from "../websocket/wsServer.js"

const prisma = new PrismaClient()

export function startLogJob() {
    cron.schedule("*/1 * * * *", async () => {
        try {
            console.log("⏰ Executando job de log...")

            const latestStatuses = await prisma.$queryRaw`
                SELECT DISTINCT ON (es.id_estacao)
                  es.id_estacao,
                  es.status
                FROM estacao_status es
                ORDER BY es.id_estacao, es.created_at DESC
            `

            let online = 0
            let offline = 0

            for (const s of latestStatuses) {
                if (s.status === "ONLINE") online++
                else if (s.status === "OFFLINE") offline++
            }

            const startOfDay = new Date()
            startOfDay.setHours(0, 0, 0, 0)

            const endOfDay = new Date()
            endOfDay.setHours(23, 59, 59, 999)

            const totalDataSentToday = await prisma.estacaoLog.aggregate({
                _sum: { data_sent: true },
                where: {
                    created_at: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            })

            const totalKB = totalDataSentToday._sum.data_sent || 0
            const totalMB = parseFloat((totalKB / 1024).toFixed(2))

            const currentDateTime = new Date().toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
            })

            const payload = {
                type: "LOG_SUMMARY",
                data: {
                    online,
                    offline,
                    total: online + offline,
                    dadosHojeMB: totalMB,
                    dataHora: currentDateTime,
                },
            }

            broadcast(payload)

            console.log("📡 Resumo enviado via WebSocket:", payload)
        } catch (error) {
            console.error("❌ Erro ao executar job de resumo:", error)
        }
    })

    console.log("✅ Job de status de estações agendado (a cada 15 minutos)")
}