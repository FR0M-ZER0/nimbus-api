// src/controllers/alertaController.js
import { PrismaClient } from "../generated/prisma/index.js";
import { createAlertaDTO, updateAlertaDTO } from "../dto/alertaDTO.js";
import { alertPaginationQueryDTO } from "../dto/alertPaginationDTO.js";

const prisma = new PrismaClient();

// POST /alerts
export const createAlerta = async (req, res) => {
  try {
    const data = createAlertaDTO.parse(req.body);

    const novoAlerta = await prisma.alerta.create({
      data: {
        titulo: data.titulo,
        texto: data.texto,
        id_tipo_alerta: data.id_tipo_alerta ?? null,
        id_parametro: data.id_tipo_parametro ?? null,
      },
    });

    if (data.usuarios && data.usuarios.length > 0) {
      await prisma.alertaUsuario.createMany({
        data: data.usuarios.map((id_usuario) => ({
          id_usuario,
          id_alerta: novoAlerta.id_alerta,
        })),
      });
    }

    res.status(201).json(novoAlerta);
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({ message: "Erro de validação", issues: error.format() });
    }
    if (error.code === "P2003") {
      return res.status(409).json({ message: `Falha na restrição de chave estrangeira: ${error.meta.field_name}` });
    }
    console.error(error);
    res.status(500).json({ message: "Erro ao criar o alerta", error: error.message });
  }
};

// GET /alerts
export const getAllAlertas = async (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder, search, tipoParametroNome, tipoAlertaValor } = 
      alertPaginationQueryDTO.parse(req.query);
      
    const skip = (page - 1) * limit;

    // Build dynamic WHERE condition
    const where = {};
    
    // 1. Search filter for title
    if (search) {
      where.titulo = {
        contains: search,
        mode: 'insensitive'
      };
    }
    
    // 2. Filter by TipoParametro's nome
    if (tipoParametroNome) {
      where.parametro = {
        tipo_parametro: {
          nome: {
            contains: tipoParametroNome,
            mode: 'insensitive'
          }
        }
      };
    }
    
    // 3. Filter by Tipo_Alerta's valor
    if (tipoAlertaValor !== undefined) {
      where.tipo_alerta = {
        valor: {
          equals: tipoAlertaValor
        }
      };
    }

    // Determine orderBy
    let orderBy;
    
    if (sortBy === 'titulo') {
      orderBy = { titulo: sortOrder };
    } 
    else if (sortBy === 'usuario_created_at') {
      // Sort by the latest user assignment date
      orderBy = { 
        alertaUsuarios: { 
          _max: { 
            created_at: sortOrder 
          } 
        } 
      };
    }
    else {
      orderBy = { [sortBy]: sortOrder };
    }

    const [alertas, totalItems] = await prisma.$transaction([
      prisma.alerta.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          tipo_alerta: true,
          parametro: {
            include: {
              estacao: true,
              tipo_parametro: true // Required for filtering
            },
          },
          alertaUsuarios: {
            include: {
              usuario: { select: { id_usuario: true, nome: true, email: true } },
            },
            orderBy: {
              created_at: 'desc' // Always get most recent user assignments first
            }
          },
        },
      }),
      prisma.alerta.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      data: alertas,
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
      message: "Erro ao buscar os alertas", 
      error: error.message 
    });
  }
};

// GET /alerts/:id
export const getAlertaById = async (req, res) => {
  try {
    const { id } = req.params;
    const alerta = await prisma.alerta.findUnique({
      where: { id_alerta: parseInt(id) },
      include: {
        tipo_alerta: true,
        parametro: {
          include: {
            estacao: true,
          },
        },
        alertaUsuarios: {
          include: {
            usuario: { select: { id_usuario: true, nome: true, email: true } },
          },
        },
      },
    });

    if (!alerta) {
      return res.status(404).json({ message: "Alerta não encontrado" });
    }

    res.status(200).json(alerta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar o alerta", error: error.message });
  }
};

// PUT /alerts/:id
export const updateAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateAlertaDTO.parse(req.body);

    const alertaAtualizado = await prisma.alerta.update({
      where: { id_alerta: parseInt(id) },
      data: {
        titulo: data.titulo,
        texto: data.texto,
        id_tipo_alerta: data.id_tipo_alerta,
        id_parametro: data.id_parametro,
      },
    });

    if (data.usuarios) {
      await prisma.alertaUsuario.deleteMany({
        where: { id_alerta: alertaAtualizado.id_alerta },
      });

      if (data.usuarios.length > 0) {
        await prisma.alertaUsuario.createMany({
          data: data.usuarios.map((id_usuario) => ({
            id_usuario,
            id_alerta: alertaAtualizado.id_alerta,
          })),
        });
      }
    }

    const alertaComUsuarios = await prisma.alerta.findUnique({
      where: { id_alerta: alertaAtualizado.id_alerta },
      include: {
        tipo_alerta: true,
        parametro: true,
        alertaUsuarios: {
          include: {
            usuario: { select: { id_usuario: true, nome: true, email: true } },
          },
        },
      },
    });

    res.status(200).json(alertaComUsuarios);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Alerta não encontrado" });
    }
    if (error.errors) {
      return res.status(400).json({ message: "Erro de validação", issues: error.format() });
    }
    console.error(error);
    res.status(500).json({ message: "Erro ao atualizar o alerta", error: error.message });
  }
};

// DELETE /alerts/:id
export const deleteAlerta = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.$transaction([
      prisma.alertaUsuario.deleteMany({
        where: { id_alerta: parseInt(id) },
      }),
      prisma.alarme.deleteMany({
        where: { id_alerta: parseInt(id) },
      }),
      prisma.alerta.delete({
        where: { id_alerta: parseInt(id) },
      }),
    ]);

    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Alerta não encontrado" });
    }
    console.error(error);
    res.status(500).json({ message: "Erro ao deletar o alerta", error: error.message });
  }
};