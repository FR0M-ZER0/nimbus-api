import { PrismaClient } from '../generated/prisma/index.js';
import { createMedidaDTO, medidaResponseDTO } from '../dto/measureDTO.js';
import { paginationQueryDTO } from '../dto/paginationDTO.js';
import { ZodError } from 'zod';

const prisma = new PrismaClient();

// POST /medidas - Cria uma nova medida
export const createMedida = async (req, res) => {
  try {
    const validatedData = createMedidaDTO.parse(req.body);

    const medida = await prisma.medida.create({
      data: validatedData,
    });

    const response = medidaResponseDTO.parse(medida);
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return res.status(400).json({
        message: 'Erro de validação nos dados enviados.',
        errors,
      });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({
        message: 'Erro de chave estrangeira: o parâmetro fornecido não existe.',
      });
    }

    console.error(error);
    res.status(500).json({ message: 'Erro interno ao criar a medida.' });
  }
};

// GET /medidas - Lista todas as medidas (com paginação)
export const getAllMedidas = async (req, res) => {
  try {
    const { page, limit } = paginationQueryDTO.parse(req.query);
    const skip = (page - 1) * limit;

    const [medidas, totalItems] = await prisma.$transaction([
      prisma.medida.findMany({
        skip,
        take: limit,
        orderBy: { data_hora: 'desc' },
        include: {
          parametro: {
            include: {
              tipo_parametro: true,
              estacao: true,
            },
          },
        },
      }),
      prisma.medida.count(),
    ]);

    const parsedMedidas = medidas.map(m => medidaResponseDTO.parse(m));
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      data: parsedMedidas,
      meta: {
        totalItems,
        currentPage: page,
        totalPages,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar as medidas', error: error.message });
  }
};

// GET /medidas/:id - Busca uma medida pelo ID
export const getMedidaById = async (req, res) => {
  try {
    const { id } = req.params;

    const medida = await prisma.medida.findUnique({
      where: { id_medida: parseInt(id, 10) },
      include: {
        parametro: {
          include: {
            tipo_parametro: true,
            estacao: true,
          },
        },
      },
    });

    if (!medida) {
      return res.status(404).json({ message: 'Medida não encontrada.' });
    }

    const response = medidaResponseDTO.parse(medida);
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar a medida', error: error.message });
  }
};

// GET /parametros/:id/medidas - Lista todas as medidas de um parâmetro
export const getMedidasByParametro = async (req, res) => {
  try {
    const { id } = req.params;
    const { page, limit } = paginationQueryDTO.parse(req.query);
    const skip = (page - 1) * limit;

    const parametro = await prisma.parametro.findUnique({
      where: { id_parametro: parseInt(id, 10) },
    });

    if (!parametro) {
      return res.status(404).json({ message: 'Parâmetro não encontrado.' });
    }

    const [medidas, totalItems] = await prisma.$transaction([
      prisma.medida.findMany({
        where: { id_parametro: parseInt(id, 10) },
        skip,
        take: limit,
        orderBy: { data_hora: 'desc' },
      }),
      prisma.medida.count({
        where: { id_parametro: parseInt(id, 10) },
      }),
    ]);

    const parsedMedidas = medidas.map(m => medidaResponseDTO.parse(m));
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      data: parsedMedidas,
      meta: {
        totalItems,
        currentPage: page,
        totalPages,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar as medidas do parâmetro', error: error.message });
  }
};

// DELETE /medidas/:id - Deleta uma medida
export const deleteMedida = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.medida.delete({
      where: { id_medida: parseInt(id, 10) },
    });

    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Medida não encontrada.' });
    }

    console.error(error);
    res.status(500).json({ message: 'Erro ao deletar a medida', error: error.message });
  }
};
