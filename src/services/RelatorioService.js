import { PrismaClient } from '../generated/prisma/index.js';
import { getPeriodoRelatorio, formatDataBr } from '../utils/dateHelper.js';
import { enviarEmailTemplate } from '../utils/emailTransporter.js';

const prisma = new PrismaClient();

export const gerarRelatorioUsuario = async (idUsuario) => {
    console.log(`[Service] Iniciando geração de relatório para usuário ID: ${idUsuario}`);


    
    const usuario = await prisma.usuario.findUnique({
        where: { id_usuario: Number(idUsuario) },
        include: {
            estacoes: {
                include: {
                    parametros: {
                        include: { tipo_parametro: true }
                    },
                    estacaoStatus: { 
                        orderBy: { created_at: 'desc' },
                        take: 1
                    }
                }
            }
        }
    });

    if (!usuario) {
        throw new Error(`Usuário com ID ${idUsuario} não encontrado.`);
    }


    const { inicioTs, fimTs, inicioDate, fimDate, textoPeriodo } = getPeriodoRelatorio();


    const dadosEstacoes = [];

    for (const estacao of usuario.estacoes) {
        const resumoSensores = [];
        let totalLeiturasEstacao = 0;


        for (const parametro of estacao.parametros) {
            
        
            const agregados = await prisma.medida.aggregate({
                where: {
                    id_parametro: parametro.id_parametro,
                    data_hora: {
                        gte: inicioTs, 
                        lte: fimTs     
                    }
                },
                _avg: { valor: true },
                _min: { valor: true },
                _max: { valor: true },
                _count: { valor: true }
            });

            
            if (agregados._count.valor > 0) {
                totalLeiturasEstacao += agregados._count.valor;
                
                resumoSensores.push({
                    nome: parametro.tipo_parametro.nome,      
                    unidade: parametro.tipo_parametro.unidade,
                    min: Number(agregados._min.valor).toFixed(1),
                    med: Number(agregados._avg.valor).toFixed(1),
                    max: Number(agregados._max.valor).toFixed(1)
                });
            }
        }


        const alarmesRecentes = await prisma.alarme.findMany({
            where: {
                id_usuario: usuario.id_usuario,
                created_at: {
                    gte: inicioDate,
                    lte: fimDate
                },
                medida: {
                    parametro: { id_estacao: estacao.id_estacao }
                }
            },
            include: { alerta: true }, 
            orderBy: { created_at: 'desc' },
            take: 5 
        });


        const statusRecente = estacao.estacaoStatus[0];
        const isOnline = statusRecente ? statusRecente.status === 'ONLINE' : false;

        dadosEstacoes.push({
            nomeEstacao: estacao.nome,
            isOnline: isOnline, 
            ultimaComunicacao: formatDataBr(statusRecente?.created_at),
            totalLeituras: totalLeiturasEstacao.toLocaleString('pt-BR'),
            tabelaDados: resumoSensores,
            alertas: alarmesRecentes.map(a => ({
                gravidade: 'Alerta',
                titulo: a.alerta.titulo,
                texto: a.alerta.texto,
                data: formatDataBr(a.created_at)
            }))
        });
    }


    const contextoEmail = {
        usuarioNome: usuario.nome,
        periodo: textoPeriodo,
        estacoes: dadosEstacoes
    };


    await enviarEmailTemplate(
        usuario.email,
        `[Nimbus] Seu Relatório Mensal de Monitoramento`,
        'relatorioMensal', 
        contextoEmail
    );

    console.log(`[Service] Relatório enviado com sucesso para ${usuario.email}`);
    return { success: true, message: `Relatório enviado para ${usuario.email}` };
};