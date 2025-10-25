import { PrismaClient } from "../generated/prisma/index.js";
import { createAlarmeDTO } from "../dto/alarmeDTO.js";
import { startOfDay, endOfDay } from 'date-fns';
import { alarmPaginationQueryDTO } from "../dto/alarmPaginationDTO.js";

const prisma = new PrismaClient();

// POST /alarmes - Cria um novo alarme
export const createAlarme = async (req, res) => {
  try {
    const data = createAlarmeDTO.parse(req.body);

    const novoAlarme = await prisma.alarme.create({
      data: {
        id_usuario: data.id_usuario,
        id_medida: data.id_medida,
        id_alerta: data.id_alerta,
      },
    });

    res.status(201).json(novoAlarme);
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({ message: "Erro de validação", issues: error.format() });
    }
    if (error.code === "P2003") {
      return res
        .status(409)
        .json({ message: `Falha na restrição de chave estrangeira: ${error.meta.field_name}` });
    }
    console.error(error);
    res.status(500).json({ message: "Erro ao criar o alarme", error: error.message });
  }
};

// GET /alarmes
export const getAllAlarmes = async (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder, id_alerta, valorMin, valorMax, valorSearch } = 
      alarmPaginationQueryDTO.parse(req.query);
      
    const skip = (page - 1) * limit;

    // Build dynamic WHERE condition
    const where = {};
    
    // 1. Filter by Alarme's id_alerta
    if (id_alerta !== undefined) {
      where.id_alerta = id_alerta;
    }
    
    // 2. Filter by Medida's valor (search)
    if (valorSearch !== undefined) {
      where.medida = {
        valor: {
          equals: valorSearch
        }
      };
    } 
    // 2b. Filter by Medida's valor (range)
    else if (valorMin !== undefined || valorMax !== undefined) {
      where.medida = {
        valor: {}
      };
      
      if (valorMin !== undefined) {
        where.medida.valor.gte = valorMin;
      }
      
      if (valorMax !== undefined) {
        where.medida.valor.lte = valorMax;
      }
    }

    // Determine orderBy
    let orderBy;
    
    if (sortBy === 'valor') {
      // Sort by Medida's valor
      orderBy = { 
        medida: { 
          valor: sortOrder 
        } 
      };
    }
    else {
      // Default: sort by created_at
      orderBy = { created_at: sortOrder };
    }

    const [alarmes, totalItems] = await prisma.$transaction([
      prisma.alarme.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          usuario: { select: { id_usuario: true, nome: true, email: true } },
          medida: true,
          alerta: true,
        },
      }),
      prisma.alarme.count({ 
        where 
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      data: alarmes,
      meta: {
        totalItems,
        currentPage: page,
        totalPages,
        itemsPerPage: limit,
      }
    });
  } catch (error) {
    console.error(error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Erro de validação nos parâmetros da requisição",
        errors: error.errors.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
    }
    
    res.status(500).json({ 
      message: "Erro ao buscar o alarme", 
      error: error.message 
    });
  }
};

// GET /alarmes/:id
export const getAlarmeById = async (req, res) => {
  try {
    const { id_usuario, id_medida, id_alerta } = req.params;
    const alarme = await prisma.alarme.findUnique({
      where: {
        id_usuario_id_medida_id_alerta: {
          id_usuario: parseInt(id_usuario),
          id_medida: parseInt(id_medida),
          id_alerta: parseInt(id_alerta),
        },
      },
      include: {
        usuario: true,
        medida: true,
        alerta: true,
      },
    });

    if (!alarme) {
      return res.status(404).json({ message: "Alarme não encontrado" });
    }

    res.status(200).json(alarme);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar o alarme", error: error.message });
  }
};

export const getTodaysAlarme = async (req, res) => {
  try {
    const alarms = await prisma.alarme.findMany({
      orderBy: { created_at: "desc" },
      where: {
        created_at: {
          gte: startOfDay(new Date()),
          lte: endOfDay(new Date())
        }
      },
      include: {
        usuario: { select: { id_usuario: true, nome: true, email: true } },
        medida: true,
        alerta: true,
      }
    })
    res.status(200).json(alarms)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erro ao buscar os alarmes de hoje", error: error.message })
  }
}

// DELETE /alarmes/:id_usuario/:id_medida/:id_alerta
export const deleteAlarme = async (req, res) => {
  try {
    const { id_usuario, id_medida, id_alerta } = req.params;
    await prisma.alarme.delete({
      where: {
        id_usuario_id_medida_id_alerta: {
          id_usuario: parseInt(id_usuario),
          id_medida: parseInt(id_medida),
          id_alerta: parseInt(id_alerta),
        },
      },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Alarme não encontrado" });
    }
    console.error(error);
    res.status(500).json({ message: "Erro ao deletar o alarme", error: error.message });
  }
};
