import { PrismaClient } from '../generated/prisma/index.js';
import { reportQueryDTO } from '../dto/reportDTO.js';
import { generatePDF } from '../services/pdfService.js';

const prisma = new PrismaClient();

export const getMeasurementReport = async (req, res) => {
  try {
    const { startDate, endDate, id_estacao, id_parametro } = reportQueryDTO.parse(req.query);

    const startUnix = Math.floor(startDate.getTime() / 1000);
    const endUnix = Math.floor(endDate.getTime() / 1000);

    const whereClause = {
      data_hora: {
        gte: startUnix,
        lte: endUnix,
      },
      parametro: {
        id_estacao: id_estacao 
      }
    };

    if (id_parametro) {
      whereClause.id_parametro = id_parametro;
    }

    const medidas = await prisma.medida.findMany({
      where: whereClause,
      include: {
        parametro: {
          include: {
            tipo_parametro: { select: { nome: true, unidade: true } },
            estacao: { select: { nome: true } }
          }
        }
      },
      orderBy: { data_hora: 'desc' }
    });

    generatePDF(
        'Relatório Histórico de Medidas', 
        { startDate, endDate, id_estacao }, 
        medidas, 
        'medidas', 
        res
    );

  } catch (error) {
    handleError(res, error);
  }
};

export const getAlarmReport = async (req, res) => {
  try {
    const { startDate, endDate, id_estacao } = reportQueryDTO.parse(req.query);

    const whereClause = {
        created_at: {
            gte: startDate,
            lte: endDate,
        },
        medida: {
            parametro: {
                id_estacao: id_estacao
            }
        }
    };

    const alarmes = await prisma.alarme.findMany({
        where: whereClause,
        include: {
            alerta: { select: { titulo: true, texto: true, tipo_alerta: true } },
            usuario: { select: { nome: true, email: true } },
            medida: {
                include: {
                    parametro: {
                        include: { 
                            estacao: { select: { nome: true } },
                            tipo_parametro: { select: { nome: true, unidade: true } }
                        }
                    }
                }
            }
        },
        orderBy: { created_at: 'desc' }
    });

    generatePDF(
        'Relatório Histórico de Alarmes', 
        { startDate, endDate, id_estacao }, 
        alarmes, 
        'alarmes', 
        res
    );

  } catch (error) {
    handleError(res, error);
  }
};

const handleError = (res, error) => {
    if (res.headersSent) return res.end(); 

    if (error.name === 'ZodError') {
        const errorMessages = error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
        }));
        return res.status(400).json({
            message: "Erro de validação nos filtros.",
            errors: errorMessages,
        });
    }
    
    console.error(error);
    res.status(500).json({ message: "Erro ao gerar relatório", error: error.message });
};