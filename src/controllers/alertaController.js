// src/controllers/alertaController.js

import { PrismaClient } from "../generated/prisma/index.js";
import { createAlertaDTO, updateAlertaDTO } from "../dto/alertaDTO.js";

const prisma = new PrismaClient();

// Post /alerts - Cria um novo alerta
export const createAlerta = async (req, res) => {
  try {
    const data = createAlertaDTO.parse(req.body);
    const novoAlerta = await prisma.alerta.create({
      data,
    });
    res.status(201).json(novoAlerta);
  } catch (error) {
    // Erro de validação do DTO (zod)
    if (error.errors) {
      return res.status(400).json({ message: "Erro de validação", issues: error.format() });
    }
    // Erro de chave estrangeira (ex: id_usuario não existe)
    if (error.code === 'P2003') {
       return res.status(409).json({ message: `Falha na restrição de chave estrangeira: ${error.meta.field_name}` });
    }
    console.error(error);
    res
      .status(500)
      .json({ message: "Erro ao criar o alerta", error: error.message });
  }
};

// Get /alerts - Lista todos os alertas
export const getAllAlertas = async (req, res) => {
  try {
    const alertas = await prisma.alerta.findMany({
      include: {
        usuario: { select: { id_usuario: true, nome: true } },
        tipo_alerta: true,
      },
    });
    res.status(200).json(alertas);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Erro ao buscar os alertas", error: error.message });
  }
};

// Get /alerts/:id - Busca um alerta pelo id
export const getAlertaById = async (req, res) => {
  try {
    const { id } = req.params;
    const alerta = await prisma.alerta.findUnique({
      where: { id_alerta: parseInt(id) },
      include: {
        usuario: { select: { id_usuario: true, nome: true, email: true } },
        tipo_alerta: true,
      },
    });

    if (!alerta) {
      return res.status(404).json({ message: "Alerta não encontrado" });
    }
    res.status(200).json(alerta);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Erro ao buscar o alerta", error: error.message });
  }
};

// Put /alertas/:id - Atualiza um alerta pelo id
export const updateAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateAlertaDTO.parse(req.body);

    const alerta = await prisma.alerta.update({
      where: { id_alerta: parseInt(id) },
      data: validatedData,
    });

    res.status(200).json(alerta);

  } catch (error) {
    // Prisma error 'P2025': Registro a ser atualizado não encontrado
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Alerta não encontrado" });
    }
    // Erro de validação do DTO (zod)
    if (error.errors) {
      return res
        .status(400)
        .json({ message: "Erro de validação", issues: error.format() });
    }
    console.error(error);
    res
      .status(500)
      .json({ message: "Erro ao atualizar o alerta", error: error.message });
  }
};

// Delete /alertas/:id - Deleta um alerta pelo id 
export const deleteAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.alerta.delete({
      where: { id_alerta: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    // Prisma error 'P2025': Registro a ser deletado não encontrado
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Alerta não encontrado" });
    }
    console.error(error);
    res
      .status(500)
      .json({ message: "Erro ao deletar o alerta", error: error.message });
  }
};


//   createAlerta,
//   getAllAlertas,
//   getAlertaById,
//   updateAlerta,
//   deleteAlerta,