import { PrismaClient } from "../generated/prisma/index.js";
import { createEstacaoStatusDTO } from "../dto/estacaoStatusDTO.js";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const prisma = new PrismaClient();

/**
 * POST /estacao-status
 */
export const createEstacaoStatus = async (req, res) => {
  try {
    const data = createEstacaoStatusDTO.parse(req.body);

    const novoStatus = await prisma.estacaoStatus.create({
      data: {
        id_estacao: data.id_estacao,
        status: data.status,
      },
    });

    return res.status(201).json(novoStatus);
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({ message: "Erro de validação", issues: error.format() });
    }
    // Foreign key constraint violation (estação inexistente)
    if (error.code === "P2003") {
      return res.status(409).json({
        message: `Falha na restrição de chave estrangeira: ${error.meta?.field_name ?? "unknown"}`,
      });
    }
    console.error(error);
    return res.status(500).json({ message: "Erro ao criar EstacaoStatus", error: error.message });
  }
};

/**
 * GET /estacao-status
 * Query params:
 *  - page (default 1)
 *  - perPage (default 10)
 *  - status (filter by status enum)
 *  - id_estacao (filter by station id)
 *  - date_from (ISO string)
 *  - date_to (ISO string)
 */
export const getAllEstacaoStatus = async (req, res) => {
  try {
    const {
      page: pageRaw = "1",
      perPage: perPageRaw = "10",
      status,
      id_estacao,
      date_from,
      date_to,
      sort = "created_at",
      order = "desc",
    } = req.query;

    const page = Math.max(parseInt(pageRaw, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(perPageRaw, 10) || 10, 1), 100);

    const where = {};

    if (status) {
      const statuses = String(status).split(",").map((s) => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        where.status = statuses[0];
      } else if (statuses.length > 1) {
        where.status = { in: statuses };
      }
    }

    if (id_estacao) {
      where.id_estacao = String(id_estacao);
    }

    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) {
        const dFrom = new Date(date_from);
        if (!isNaN(dFrom)) where.created_at.gte = dFrom;
      }
      if (date_to) {
        const dTo = new Date(date_to);
        if (!isNaN(dTo)) where.created_at.lte = dTo;
      }
      if (Object.keys(where.created_at).length === 0) delete where.created_at;
    }

    const total = await prisma.estacaoStatus.count({ where });

    const allowedSortFields = ["created_at", "id_status", "status"];
    const sortField = allowedSortFields.includes(sort) ? sort : "created_at";
    const sortOrder = order === "asc" ? "asc" : "desc";

    const items = await prisma.estacaoStatus.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        estacao: true,
      },
    });

    const totalPages = Math.max(Math.ceil(total / perPage), 1);

    return res.status(200).json({
      meta: {
        total,
        page,
        perPage,
        totalPages,
      },
      data: items,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar EstacaoStatus", error: error.message });
  }
};

/**
 * GET /estacao-status/:id
 */
export const getEstacaoStatusById = async (req, res) => {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);

    if (Number.isNaN(idInt)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const status = await prisma.estacaoStatus.findUnique({
      where: { id_status: idInt },
      include: { estacao: true },
    });

    if (!status) {
      return res.status(404).json({ message: "EstacaoStatus não encontrado" });
    }

    return res.status(200).json(status);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar EstacaoStatus", error: error.message });
  }
};

/**
 * DELETE /estacao-status/:id
 */
export const deleteEstacaoStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);

    if (Number.isNaN(idInt)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    await prisma.estacaoStatus.delete({
      where: { id_status: idInt },
    });

    return res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "EstacaoStatus não encontrado" });
    }
    console.error(error);
    return res.status(500).json({ message: "Erro ao deletar EstacaoStatus", error: error.message });
  }
};

/**
 * GET /estacao-status/estacao/:id_estacao
 * Retorna todos os status de uma estação específica (com paginação e filtros opcionais)
 */
export const getStatusByEstacao = async (req, res) => {
  try {
    const { id_estacao } = req.params;
    const { status, data_inicial, data_final, page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = { id_estacao };

    if (status) where.status = status;
    if (data_inicial || data_final) {
      where.created_at = {
        gte: data_inicial ? startOfDay(new Date(data_inicial)) : undefined,
        lte: data_final ? endOfDay(new Date(data_final)) : undefined,
      };
    }

    const [data, total] = await Promise.all([
      prisma.estacaoStatus.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: "desc" },
        include: {
          estacao: { select: { id_estacao: true, nome: true } },
        },
      }),
      prisma.estacaoStatus.count({ where }),
    ]);

    if (data.length === 0) {
      return res.status(404).json({ message: "Nenhum status encontrado para esta estação." });
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
      message: "Erro ao buscar os status da estação.",
      error: error.message,
    });
  }
};

/**
 * GET /estacao-status/estacao/:id_estacao/ultimo
 * Retorna o status mais recente de uma estação específica
 */
export const getLastStatusByEstacao = async (req, res) => {
  try {
    const { id_estacao } = req.params;

    const ultimoStatus = await prisma.estacaoStatus.findFirst({
      where: { id_estacao },
      orderBy: { created_at: "desc" },
      include: {
        estacao: { select: { id_estacao: true, nome: true } },
      },
    });

    if (!ultimoStatus) {
      return res
        .status(404)
        .json({ message: "Nenhum status encontrado para esta estação." });
    }

    res.status(200).json(ultimoStatus);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erro ao buscar o status mais recente da estação.",
      error: error.message,
    });
  }
};

/**
 * GET /estacao-status/resumo
 * Retorna a quantidade de estações ONLINE e OFFLINE (baseado no último status de cada uma)
 */
export const getEstacoesStatusByOnOff = async (req, res) => {
  try {
    const lastStatus = await prisma.$queryRaw`
      SELECT DISTINCT ON (es.id_estacao)
        es.id_estacao,
        es.status
      FROM estacao_status es
      ORDER BY es.id_estacao, es.created_at DESC
    `;

    let online = 0;
    let offline = 0;

    for (const s of lastStatus) {
      if (s.status === "ONLINE") online++;
      else if (s.status === "OFFLINE") offline++;
    }

    const currentDate = format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });

    return res.status(200).json({
      current_date: currentDate,
      online,
      offline,
      total: online + offline,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erro ao calcular resumo de status das estações",
      error: error.message,
    });
  }
};

// GET /activity/history
// Retorna as últimas 30 atividades (status + logs + processamentos)
export const getActivityHistory = async (req, res) => {
  try {
    const [status, logs, processamentos] = await Promise.all([
      prisma.estacaoStatus.findMany({
        orderBy: { created_at: "desc" },
        take: 30,
        include: { estacao: { select: { id_estacao: true } } },
      }),
      prisma.estacaoLog.findMany({
        orderBy: { created_at: "desc" },
        take: 30,
        include: { estacao: { select: { id_estacao: true } } },
      }),
      prisma.dataProcessingLog.findMany({
        orderBy: { created_at: "desc" },
        take: 30,
      }),
    ]);

    const history = [
      ...status.map(s => ({
        date: s.created_at,
        station: s.id_estacao,
        event: s.status === "ONLINE" ? "Retomou conexão" : "Conexão perdida"
      })),
      ...logs.map(l => ({
        date: l.created_at,
        station: l.id_estacao,
        event: "Enviou dados não processados"
      })),
      ...processamentos.map(p => ({
        date: p.created_at,
        station: "Sistema",
        event: "Dados processados"
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 30);

    return res.status(200).json({ history });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar histórico", error: error.message });
  }
};

// GET /activity/history/paginated?page=1&limit=30
// Retorna atividades com paginação e campo de status (Info / Erro)
export const getActivityHistoryAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 30
    const skip = (page - 1) * limit

    const [statusList, logs, processamentos, totalCount] = await Promise.all([
      prisma.estacaoStatus.findMany({
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: { estacao: { select: { id_estacao: true } } },
      }),
      prisma.estacaoLog.findMany({
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: { estacao: { select: { id_estacao: true } } },
      }),
      prisma.dataProcessingLog.findMany({
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      Promise.all([
        prisma.estacaoStatus.count(),
        prisma.estacaoLog.count(),
        prisma.dataProcessingLog.count(),
      ]).then(([c1, c2, c3]) => c1 + c2 + c3)
    ])

    const history = [
      ...statusList.map(s => ({
        date: s.created_at,
        station: s.id_estacao,
        event: s.status === "ONLINE" ? "Retomou conexão" : "Conexão perdida",
        status: s.status === "ONLINE" ? "Info" : "Erro"
      })),
      ...logs.map(l => ({
        date: l.created_at,
        station: l.id_estacao,
        event: "Enviou dados não processados",
        status: "Info"
      })),
      ...processamentos.map(p => ({
        date: p.created_at,
        station: "Sistema",
        event: "Dados processados",
        status: "Info"
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))

    return res.status(200).json({
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      history
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: "Erro ao buscar histórico paginado",
      error: error.message
    })
  }
}
