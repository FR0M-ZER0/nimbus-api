import { PrismaClient } from "../generated/prisma/index.js";
import { createAlarmeDTO } from "../dto/alarmeDTO.js";
import { startOfDay, endOfDay } from 'date-fns'

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
    const alarmes = await prisma.alarme.findMany({
      include: {
        usuario: { select: { id_usuario: true, nome: true, email: true } },
        medida: {
          include: {
            parametro: {
              include: {
                estacao: true,
                tipo_parametro: true
              }
            }
          }
        },
        alerta: {
          include: {
            tipo_alerta: true
          }
        }
      },
      orderBy: { created_at: "desc" },
    });

    res.status(200).json(alarmes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar os alarmes", error: error.message });
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
        medida: {
          include: {
            parametro: {
              include: {
                estacao: true,
                tipo_parametro: true
              }
            }
          }
        },
        alerta: {
          include: {
            tipo_alerta: true
          }
        }
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
