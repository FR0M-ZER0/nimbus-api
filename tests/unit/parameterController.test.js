import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
    createParameter, 
    getAllParameters, 
    getParameterById, 
    updateParameter, 
    deleteParameter,
    getParametersByStationId
} from '../../src/controllers/parameterController.js';

import { createParameterDTO, updateParameterDTO } from '../../src/dto/parameterDTO.js';

const { mockPrisma } = vi.hoisted(() => {
    return {
        mockPrisma: {
            parametro: {
                create: vi.fn(),
                findMany: vi.fn(),
                findUnique: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
            },
        }
    }
});

vi.mock('../../src/generated/prisma/index.js', () => ({
    PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
}));

const mockResponse = () => {
    const res = {};
    res.status = vi.fn().mockReturnThis();
    res.json = vi.fn().mockReturnThis();
    res.send = vi.fn().mockReturnThis();
    return res;
};

vi.spyOn(createParameterDTO, 'parse').mockImplementation((data) => data);
vi.spyOn(updateParameterDTO, 'parse').mockImplementation((data) => data);

beforeEach(() => {
    vi.clearAllMocks();
});

describe('parameterController - Testes Unitários', () => {

    const MOCK_PARAM = { 
        id_parametro: 1, 
        id_estacao: 'TEST-01', 
        id_tipo_parametro: 10,
        descricao: 'Parametro Teste' 
    };

    describe('createParameter', () => {
        it('Deve retornar 201 e o parâmetro criado', async () => {
            const mockReq = { body: MOCK_PARAM };
            mockPrisma.parametro.create.mockResolvedValue(MOCK_PARAM);
            const mockRes = mockResponse();

            await createParameter(mockReq, mockRes);

            expect(createParameterDTO.parse).toHaveBeenCalledWith(mockReq.body);
            expect(mockPrisma.parametro.create).toHaveBeenCalledWith({ data: MOCK_PARAM });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(MOCK_PARAM);
        });

        it('Deve retornar 409 se houver conflito de ID (P2002)', async () => {
            const mockReq = { body: MOCK_PARAM };
            mockPrisma.parametro.create.mockRejectedValue({ code: 'P2002' });
            const mockRes = mockResponse();

            await createParameter(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(409);
            expect(mockRes.json).toHaveBeenCalledWith({ error: "Parâmetro com este ID já existe." });
        });

        it('Deve retornar 400 se houver erro de validação', async () => {
            const mockReq = { body: {} };
            const validationError = { errors: [], format: () => 'Validation Error' };
            createParameterDTO.parse.mockImplementationOnce(() => { throw validationError; });
            const mockRes = mockResponse();

            await createParameter(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Erro de validação" }));
        });

        it('Deve retornar 500 em caso de erro genérico', async () => {
            const mockReq = { body: MOCK_PARAM };
            mockPrisma.parametro.create.mockRejectedValue(new Error('DB Error'));
            const mockRes = mockResponse();

            await createParameter(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getAllParameters', () => {
        it('Deve retornar 200 e a lista de parâmetros', async () => {
            const mockList = [MOCK_PARAM];
            mockPrisma.parametro.findMany.mockResolvedValue(mockList);
            const mockReq = {};
            const mockRes = mockResponse();

            await getAllParameters(mockReq, mockRes);

            expect(mockPrisma.parametro.findMany).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockList);
        });

        it('Deve retornar 500 se o banco falhar', async () => {
            mockPrisma.parametro.findMany.mockRejectedValue(new Error('DB Error'));
            const mockReq = {};
            const mockRes = mockResponse();

            await getAllParameters(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getParameterById', () => {
        it('Deve retornar 200 e o parâmetro se encontrado', async () => {
            mockPrisma.parametro.findUnique.mockResolvedValue(MOCK_PARAM);
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await getParameterById(mockReq, mockRes);

            expect(mockPrisma.parametro.findUnique).toHaveBeenCalledWith({ where: { id_parametro: 1 } });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(MOCK_PARAM);
        });

        it('Deve retornar 404 se não encontrado', async () => {
            mockPrisma.parametro.findUnique.mockResolvedValue(null);
            const mockReq = { params: { id: '999' } };
            const mockRes = mockResponse();

            await getParameterById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Parâmetro não encontrado" });
        });

        it('Deve retornar 500 se houver erro no banco', async () => {
            mockPrisma.parametro.findUnique.mockRejectedValue(new Error('DB Error'));
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await getParameterById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('updateParameter', () => {
        it('Deve retornar 200 e atualizar o parâmetro', async () => {
            const mockReq = { params: { id: '1' }, body: { descricao: 'Nova Desc' } };
            const updatedData = { ...MOCK_PARAM, descricao: 'Nova Desc' };
            
            mockPrisma.parametro.update.mockResolvedValue(updatedData);
            const mockRes = mockResponse();

            await updateParameter(mockReq, mockRes);

            expect(updateParameterDTO.parse).toHaveBeenCalled();
            expect(mockPrisma.parametro.update).toHaveBeenCalledWith({
                where: { id_parametro: 1 },
                data: mockReq.body
            });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(updatedData);
        });

        it('Deve retornar 404 se o registro não existir (P2025)', async () => {
            const mockReq = { params: { id: '999' }, body: {} };
            mockPrisma.parametro.update.mockRejectedValue({ code: 'P2025' });
            const mockRes = mockResponse();

            await updateParameter(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Parâmetro não encontrado" });
        });

        it('Deve retornar 400 se houver erro de validação', async () => {
            const mockReq = { params: { id: '1' }, body: {} };
            const validationError = { errors: [], format: () => 'Validation Error' };
            updateParameterDTO.parse.mockImplementationOnce(() => { throw validationError; });
            const mockRes = mockResponse();

            await updateParameter(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });

    describe('deleteParameter', () => {
        it('Deve retornar 204 ao deletar com sucesso', async () => {
            mockPrisma.parametro.delete.mockResolvedValue(MOCK_PARAM);
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await deleteParameter(mockReq, mockRes);

            expect(mockPrisma.parametro.delete).toHaveBeenCalledWith({ where: { id_parametro: 1 } });
            expect(mockRes.status).toHaveBeenCalledWith(204);
            expect(mockRes.send).toHaveBeenCalled();
        });

        it('Deve retornar 404 se o registro não existir (P2025)', async () => {
            mockPrisma.parametro.delete.mockRejectedValue({ code: 'P2025' });
            const mockReq = { params: { id: '999' } };
            const mockRes = mockResponse();

            await deleteParameter(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Parâmetro não encontrado" });
        });
    });

    describe('getParametersByStationId', () => {
        it('Deve retornar 200 e a lista de parâmetros da estação', async () => {
            const mockList = [MOCK_PARAM];
            mockPrisma.parametro.findMany.mockResolvedValue(mockList);
            const mockReq = { params: { id_estacao: 'TEST-01' } };
            const mockRes = mockResponse();

            await getParametersByStationId(mockReq, mockRes);

            expect(mockPrisma.parametro.findMany).toHaveBeenCalledWith({
                where: { id_estacao: 'TEST-01' },
                include: { tipo_parametro: true }
            });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockList);
        });

        it('Deve retornar 404 se a lista estiver vazia', async () => {
            mockPrisma.parametro.findMany.mockResolvedValue([]);
            const mockReq = { params: { id_estacao: 'TEST-01' } };
            const mockRes = mockResponse();

            await getParametersByStationId(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Nenhum parâmetro encontrado para esta estação." });
        });

        it('Deve retornar 500 se houver erro no banco', async () => {
            mockPrisma.parametro.findMany.mockRejectedValue(new Error('DB Error'));
            const mockReq = { params: { id_estacao: 'TEST-01' } };
            const mockRes = mockResponse();

            await getParametersByStationId(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });
});