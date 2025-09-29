import { PrismaClient } from "../generated/prisma/index.js";
import { createTipoAlertaDTO, updateTipoAlertaDTO } from "../dto/tipoAlertaDTO.js";

const prisma = new PrismaClient();

// POST /tipo-alertas
export const createTipoAlerta = async (req, res) => {
  try {
    const data = createTipoAlertaDTO.parse(req.body);

    const novoTipo = await prisma.tipoAlerta.create({
      data: {
        operador: data.operador,
        valor: data.valor,
      },
    });

    res.status(201).json(novoTipo);
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({ message: "Erro de validação", issues: error.format() });
    }
    console.error(error);
    res.status(500).json({ message: "Erro ao criar tipo de alerta", error: error.message });
  }
};

// GET /tipo-alertas
export const getAllTipoAlertas = async (req, res) => {
  try {
    const tipos = await prisma.tipoAlerta.findMany({
      include: { alertas: true },
      orderBy: { id: "asc" },
    });

    res.status(200).json(tipos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar tipos de alerta", error: error.message });
  }
};

// GET /tipo-alertas/:id
export const getTipoAlertaById = async (req, res) => {
  try {
    const { id } = req.params;
    const tipo = await prisma.tipoAlerta.findUnique({
      where: { id: parseInt(id) },
      include: { alertas: true },
    });

    if (!tipo) {
      return res.status(404).json({ message: "Tipo de alerta não encontrado" });
    }

    res.status(200).json(tipo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar tipo de alerta", error: error.message });
  }
};

// PUT /tipo-alertas/:id
export const updateTipoAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateTipoAlertaDTO.parse(req.body);

    const tipoAtualizado = await prisma.tipoAlerta.update({
      where: { id: parseInt(id) },
      data,
    });

    res.status(200).json(tipoAtualizado);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Tipo de alerta não encontrado" });
    }
    if (error.errors) {
      return res.status(400).json({ message: "Erro de validação", issues: error.format() });
    }
    console.error(error);
    res.status(500).json({ message: "Erro ao atualizar tipo de alerta", error: error.message });
  }
};

// DELETE /tipo-alertas/:id
export const deleteTipoAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.tipoAlerta.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Tipo de alerta não encontrado" });
    }
    console.error(error);
    res.status(500).json({ message: "Erro ao deletar tipo de alerta", error: error.message });
  }
};
