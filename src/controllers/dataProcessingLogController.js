import { PrismaClient } from "../generated/prisma/index.js";
import { createDataProcessingLogDTO } from "../dto/dataProcessingLogDTO.js";
import { startOfDay, endOfDay } from "date-fns";

const prisma = new PrismaClient();

/**
 * POST /data-processing-log
 * Cria um novo log de processamento de dados
 */
export const createDataProcessingLog = async (req, res) => {
  try {
    createDataProcessingLogDTO.parse(req.body);

    const novoLog = await prisma.dataProcessingLog.create({
      data: {},
    });

    res.status(201).json(novoLog);
  } catch (error) {
    if (error.errors) {
      return res
        .status(400)
        .json({ message: "Erro de validação", issues: error.format() });
    }
    console.error(error);
    res
      .status(500)
      .json({ message: "Erro ao criar o log de processamento", error: error.message });
  }
};

/**
 * GET /data-processing-log
 * Lista logs com paginação e filtros por data
 * Exemplo: ?data_inicial=2025-10-01&data_final=2025-10-10&page=1&limit=10
 */
export const getAllDataProcessingLogs = async (req, res) => {
  try {
    const { data_inicial, data_final, page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {};

    if (data_inicial || data_final) {
      where.created_at = {
        gte: data_inicial ? startOfDay(new Date(data_inicial)) : undefined,
        lte: data_final ? endOfDay(new Date(data_final)) : undefined,
      };
    }

    const [data, total] = await Promise.all([
      prisma.dataProcessingLog.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: "desc" },
      }),
      prisma.dataProcessingLog.count({ where }),
    ]);

    res.status(200).json({
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erro ao buscar logs de processamento",
      error: error.message,
    });
  }
};

/**
 * GET /data-processing-log/:id
 * Retorna um log específico pelo ID
 */
export const getDataProcessingLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await prisma.dataProcessingLog.findUnique({
      where: { id_log: parseInt(id) },
    });

    if (!log) {
      return res.status(404).json({ message: "Log de processamento não encontrado" });
    }

    res.status(200).json(log);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erro ao buscar log de processamento",
      error: error.message,
    });
  }
};

/**
 * DELETE /data-processing-log/:id
 * Exclui um log de processamento
 */
export const deleteDataProcessingLog = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.dataProcessingLog.delete({
      where: { id_log: parseInt(id) },
    });

    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Log não encontrado" });
    }

    console.error(error);
    res.status(500).json({
      message: "Erro ao deletar log de processamento",
      error: error.message,
    });
  }
};
