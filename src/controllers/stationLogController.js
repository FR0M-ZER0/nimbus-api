import { PrismaClient } from "../generated/prisma/index.js";
import { createEstacaoLogDTO } from "../dto/estacaoLogDTO.js";
import { startOfDay, endOfDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const prisma = new PrismaClient();

/**
 * POST /estacao-log
 * Cria um novo log de estação
 */
export const createEstacaoLog = async (req, res) => {
  try {
    const data = createEstacaoLogDTO.parse(req.body);

    const novoLog = await prisma.estacaoLog.create({
      data: {
        id_estacao: data.id_estacao,
        data_sent: data.data_sent,
      },
      include: {
        estacao: { select: { id_estacao: true, nome: true } },
      },
    });

    res.status(201).json(novoLog);
  } catch (error) {
    if (error.errors) {
      return res
        .status(400)
        .json({ message: "Erro de validação", issues: error.format() });
    }
    if (error.code === "P2003") {
      return res.status(409).json({
        message: `Falha na restrição de chave estrangeira: ${error.meta.field_name}`,
      });
    }
    console.error(error);
    res.status(500).json({ message: "Erro ao criar o log da estação", error: error.message });
  }
};

/**
 * GET /estacao-log
 * Lista logs com paginação e filtros
 * Filtros: ?id_estacao=EST001&data_min=100&data_max=500&data_inicial=2025-10-01&data_final=2025-10-15&page=1&limit=10
 */
export const getAllEstacaoLogs = async (req, res) => {
  try {
    const {
      id_estacao,
      data_min,
      data_max,
      data_inicial,
      data_final,
      page = 1,
      limit = 10,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {};

    if (id_estacao) where.id_estacao = id_estacao;
    if (data_min || data_max) {
      where.data_sent = {
        gte: data_min ? Number(data_min) : undefined,
        lte: data_max ? Number(data_max) : undefined,
      };
    }
    if (data_inicial || data_final) {
      where.created_at = {
        gte: data_inicial ? startOfDay(new Date(data_inicial)) : undefined,
        lte: data_final ? endOfDay(new Date(data_final)) : undefined,
      };
    }

    const [data, total] = await Promise.all([
      prisma.estacaoLog.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: "desc" },
        include: {
          estacao: { select: { id_estacao: true, nome: true } },
        },
      }),
      prisma.estacaoLog.count({ where }),
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
      message: "Erro ao buscar logs de estação",
      error: error.message,
    });
  }
};

/**
 * GET /estacao-log/:id
 * Retorna um log específico
 */
export const getEstacaoLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await prisma.estacaoLog.findUnique({
      where: { id_log: parseInt(id) },
      include: {
        estacao: { select: { id_estacao: true, nome: true } },
      },
    });

    if (!log) {
      return res.status(404).json({ message: "Log da estação não encontrado" });
    }

    res.status(200).json(log);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erro ao buscar log da estação",
      error: error.message,
    });
  }
};

/**
 * DELETE /estacao-log/:id
 * Exclui um log específico
 */
export const deleteEstacaoLog = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.estacaoLog.delete({
      where: { id_log: parseInt(id) },
    });

    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Log da estação não encontrado" });
    }
    console.error(error);
    res.status(500).json({ message: "Erro ao deletar log", error: error.message });
  }
};

/**
 * GET /estacao-log/estacao/:id_estacao
 * Retorna todos os logs de uma estação específica (com paginação e filtros)
 */
export const getLogsByEstacao = async (req, res) => {
  try {
    const { id_estacao } = req.params;
    const { data_min, data_max, data_inicial, data_final, page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = { id_estacao };

    if (data_min || data_max) {
      where.data_sent = {
        gte: data_min ? Number(data_min) : undefined,
        lte: data_max ? Number(data_max) : undefined,
      };
    }
    if (data_inicial || data_final) {
      where.created_at = {
        gte: data_inicial ? startOfDay(new Date(data_inicial)) : undefined,
        lte: data_final ? endOfDay(new Date(data_final)) : undefined,
      };
    }

    const [data, total] = await Promise.all([
      prisma.estacaoLog.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: "desc" },
        include: {
          estacao: { select: { id_estacao: true, nome: true } },
        },
      }),
      prisma.estacaoLog.count({ where }),
    ]);

    if (data.length === 0) {
      return res.status(404).json({ message: "Nenhum log encontrado para esta estação." });
    }

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
      message: "Erro ao buscar logs da estação.",
      error: error.message,
    });
  }
};

/**
 * GET /estacao-log/hoje
 * Retorna o total de dados enviados (data_sent) no dia atual em MB
 */
export const getTotalDataSentToday = async (req, res) => {
  try {
    const today = new Date();

    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    const result = await prisma.estacaoLog.aggregate({
      _sum: {
        data_sent: true,
      },
      where: {
        created_at: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    const totalDataSentKB = result._sum.data_sent || 0;
    const totalDataSentMB = totalDataSentKB / 1024;

    const currentDate = format(today, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });

    res.status(200).json({
      data: {
        current_date: currentDate,
        total_data_sent_mb: parseFloat(totalDataSentMB.toFixed(2)),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erro ao calcular o total de dados enviados hoje",
      error: error.message,
    });
  }
};
