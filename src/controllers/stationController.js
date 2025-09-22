import { PrismaClient } from '../generated/prisma/index.js';
import { createStationDTO, updateStationDTO } from '../dto/stationDTO.js';

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
        if (error.code === 'P2002') {
            res.status(409).json({ error: 'Estação com este id_estacao já existe.' });
        }
        if (error.errors) {
            res.status(400).json({ message: "Erro de validação", issues: error.format() });
        }
        console.error(error);
        res.status(500).json({ message: "Erro ao criar a estação", error: error.message });
    }
};

// Get /stations - Lista todas as estações
export const getAllStations = async (req, res) => {
    try {
        const stations = await prisma.estacao.findMany();
        res.status(200).json(stations);
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
            where: { id_estacao: parseInt(id) },
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
            where: { id_estacao: parseInt(id) },
            data: validatedData,
        });

        res.status(200).json(station);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "Estação não encontrada" });
        }
        if (error.errors) {
            res.status(400).json({ message: "Erro de validação", issues: error.format() });
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
            where: { id_estacao: parseInt(id) },
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