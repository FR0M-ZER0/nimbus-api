import { ZodError } from 'zod';
import { PrismaClient } from '../generated/prisma/index.js';
import { createStationDTO, updateStationDTO } from '../dto/stationDTO.js';
import { paginationQueryDTO } from '../dto/paginationDTO.js';

const prisma = new PrismaClient();

// Post /stations - Cria uma nova estação
export const createStation = async (req, res) => {
  try {
    const validatedData = createStationDTO.parse(req.body);
    const station = await prisma.estacao.create({
      data: validatedData,
    });
    res.status(201).json(station);
  } catch (error) {
    // A verificação robusta que funcionou no teste de fumaça
    if (error.name === 'ZodError') { 
    const errorMessages = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return res.status(400).json({
        message: "Erro de validação nos dados enviados.",
        errors: errorMessages,
      });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({ message: `A estação com o id informado já existe.` });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({
        message: `Erro de chave estrangeira: O usuário com o ID fornecido não existe.`,
      });
    }

    console.error(error);
    return res.status(500).json({ message: 'Erro interno ao criar a estação.' });
  }
};


// Get /stations - Lista todas as estações
export const getAllStations = async (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder } = paginationQueryDTO.parse(req.query);
        
        const skip = (page - 1) * limit;

        const [stations, totalItems] = await prisma.$transaction([
            prisma.estacao.findMany({
                skip: skip,
                take: limit,
                orderBy: { data_criacao: 'desc' },
            }),

            prisma.estacao.count(),
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        res.status(200).json({
            data: stations,
            meta: {
                totalItems,
                currentPage: page,
                totalPages,
                itemsPerPage: limit,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao buscar as estações", error: error.message });
    }
};

// Get /stations/:id - Busca uma estação pelo id
export const getStationById = async (req, res) => {
    try {
        const { id } = req.params;
        const station = await prisma.estacao.findUnique({
            where: { id_estacao: id },
            include: {
                parametros: {
                include: {
                    tipo_parametro: true,
                },
                },
            },
        });

        if (!station) {
            return res.status(404).json({ message: "Estação não encontrada" });
        }

        res.status(200).json(station);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao buscar a estação", error: error.message });
    }
};

// Put /stations/:id - Atualiza uma estação pelo id
export const updateStation = async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateStationDTO.parse(req.body);
        const station = await prisma.estacao.update({
            where: { id_estacao: id },
            data: validatedData,
        });
        res.status(200).json(station);
    } catch (error) {
        if (error.name === 'ZodError') {
            const errorMessages = error.errors.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message,
            }));
            return res.status(400).json({
                message: "Erro de validação nos dados enviados.",
                errors: errorMessages,
            });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "Estação não encontrada para atualização." });
        }
        console.error(error);
        res.status(500).json({ message: "Erro ao atualizar a estação", error: error.message });
    }
};

// Delete /stations/:id - Deleta uma estação pelo id
export const deleteStation = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.estacao.delete({
            where: { id_estacao: id },
        });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "Estação não encontrada" });
        }
        console.error(error);
        res.status(500).json({ message: "Erro ao deletar a estação", error: error.message });
    }
};