// controllers/tipoParametroController.js
import { PrismaClient } from "../generated/prisma/index.js";
import { createTipoParametroDTO, updateTipoParametroDTO } from "../dto/type_ParameterDTO.js";

const prisma = new PrismaClient();

// Criar TipoParametro
export const createTipoParametro = async (req, res) => {
  try {
    const data = createTipoParametroDTO.parse(req.body);
    const tipoParametro = await prisma.tipoParametro.create({ data });
    res.status(201).json(tipoParametro);
  } catch (err) {
    res.status(400).json({ error: err.errors || err.message });
  }
};

// Listar todos
export const getAllTipoParametro = async (req, res) => {
  try {
    const tipos = await prisma.tipoParametro.findMany();
    res.json(tipos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Buscar por ID
export const getTipoParametroById = async (req, res) => {
  const { id } = req.params;
  try {
    const tipo = await prisma.tipoParametro.findUnique({ where: { id_tipo_parametro: Number(id) } });
    if (!tipo) return res.status(404).json({ error: "TipoParametro não encontrado" });
    res.json(tipo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Atualizar
export const updateTipoParametro = async (req, res) => {
  const { id } = req.params;
  try {
    const data = updateTipoParametroDTO.parse(req.body);
    const updated = await prisma.tipoParametro.update({
      where: { id_tipo_parametro: Number(id) },
      data,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.errors || err.message });
  }
};

// Deletar
export const deleteTipoParametro = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.tipoParametro.delete({ where: { id_tipo_parametro: Number(id) } });
    res.json({ message: "TipoParametro deletado com sucesso" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
