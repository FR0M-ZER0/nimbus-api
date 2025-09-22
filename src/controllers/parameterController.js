import { PrismaClient } from "../generated/prisma/index.js";
import { createParameterDTO, updateParameterDTO } from "../dto/parameterDTO.js";

const prisma = new PrismaClient();

// Post /parameters - Cria um novo parâmetro
export const createParameter = async (req, res) => {
  try {
    const validatedData = createParameterDTO.parse(req.body);
    const parameter = await prisma.parametro.create({
      data: validatedData,
    });
    res.status(201).json(parameter);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Parâmetro com este ID já existe.",
      });
    }
    if (error.errors) {
      return res.status(400).json({ message: "Erro de validação", issues: error.format() });
    }
    console.error(error);
    res
      .status(500)
      .json({ message: "Erro ao criar o parâmetro", error: error.message });
  }
};

// Get /parameters - Lista todos os parâmetros
export const getAllParameters = async (req, res) => {
  try {
    const parameters = await prisma.parametro.findMany();
    res.status(200).json(parameters);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Erro ao buscar os parâmetros", error: error.message });
  }
};

// Get /parameters/:id - Busca um parâmetro pelo id
export const getParameterById = async (req, res) => {
  try {
    const { id } = req.params;
    const parameter = await prisma.parametro.findUnique({
      where: { id_parametro: parseInt(id) },
    });

    if (!parameter) {
      return res.status(404).json({ message: "Parâmetro não encontrado" });
    }
    res.status(200).json(parameter);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Erro ao buscar o parâmetro", error: error.message });
  }
};

// Put /parameters/:id - Atualiza um parâmetro pelo id
export const updateParameter = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateParameterDTO.parse(req.body);

    const parameter = await prisma.parametro.update({
      where: { id_parametro: parseInt(id) },
      data: validatedData,
    });

    res.status(200).json(parameter);

  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Parâmetro não encontrado" });
    }
    if (error.errors) {
      return res
        .status(400)
        .json({ message: "Erro de validação", issues: error.format() });
    }
    console.error(error);
    res
      .status(500)
      .json({ message: "Erro ao atualizar o parâmetro", error: error.message });
  }
};

// Delete /parameters/:id - Deleta um parâmetro pelo id 
export const deleteParameter = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.parametro.delete({
      where: { id_parametro: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Parâmetro não encontrado" });
    }
    console.error(error);
    res
      .status(500)
      .json({ message: "Erro ao deletar o parâmetro", error: error.message });
  }
};