// src/controllers/alertaController.js
import { PrismaClient } from "../generated/prisma/index.js";
import { createAlertaDTO, updateAlertaDTO } from "../dto/alertaDTO.js";

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
    const alertas = await prisma.alerta.findMany({
      include: {
        tipo_alerta: true,
        parametro: true,
        alertaUsuarios: {
          include: {
            usuario: { select: { id_usuario: true, nome: true, email: true } },
          },
        },
      },
      orderBy: { data_hora: "desc" },
    });

    res.status(200).json(alertas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar os alertas", error: error.message });
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
        parametro: true,
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