import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
    createDataProcessingLog, 
    getAllDataProcessingLogs, 
    getDataProcessingLogById, 
    deleteDataProcessingLog 
} from '../../src/controllers/dataProcessingLogController.js';

import { createDataProcessingLogDTO } from '../../src/dto/dataProcessingLogDTO.js';

const { mockPrisma } = vi.hoisted(() => {
    return {
        mockPrisma: {
            dataProcessingLog: {
                create: vi.fn(),
                findMany: vi.fn(),
                count: vi.fn(),
                findUnique: vi.fn(),
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

vi.spyOn(createDataProcessingLogDTO, 'parse').mockImplementation((data) => data);

beforeEach(() => {
    vi.clearAllMocks();
});

describe('dataProcessingLogController - Testes Unitários', () => {

    const MOCK_LOG = { id_log: 1, created_at: new Date() };

    describe('createDataProcessingLog', () => {
        it('Deve retornar 201 e o log criado', async () => {
            const mockReq = { body: {} };
            mockPrisma.dataProcessingLog.create.mockResolvedValue(MOCK_LOG);
            const mockRes = mockResponse();

            await createDataProcessingLog(mockReq, mockRes);

            expect(createDataProcessingLogDTO.parse).toHaveBeenCalledWith(mockReq.body);
            expect(mockPrisma.dataProcessingLog.create).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(MOCK_LOG);
        });

        it('Deve retornar 400 se houver erro de validação', async () => {
            const mockReq = { body: {} };
            const validationError = { errors: [], format: () => 'Validation Error' };
            createDataProcessingLogDTO.parse.mockImplementationOnce(() => { throw validationError; });
            const mockRes = mockResponse();

            await createDataProcessingLog(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Erro de validação" }));
        });

        it('Deve retornar 500 em caso de erro genérico', async () => {
            const mockReq = { body: {} };
            mockPrisma.dataProcessingLog.create.mockRejectedValue(new Error('DB Error'));
            const mockRes = mockResponse();

            await createDataProcessingLog(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getAllDataProcessingLogs', () => {
        it('Deve retornar 200 e a lista de logs com paginação padrão', async () => {
            const mockList = [MOCK_LOG];
            const mockCount = 1;
            mockPrisma.dataProcessingLog.findMany.mockResolvedValue(mockList);
            mockPrisma.dataProcessingLog.count.mockResolvedValue(mockCount);
            
            const mockReq = { query: {} };
            const mockRes = mockResponse();

            await getAllDataProcessingLogs(mockReq, mockRes);

            expect(mockPrisma.dataProcessingLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
                skip: 0,
                take: 10,
                orderBy: { created_at: "desc" }
            }));
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                data: mockList,
                pagination: expect.objectContaining({ total: mockCount, page: 1 })
            }));
        });

        it('Deve retornar 200 e aplicar filtros de data se fornecidos', async () => {
            const mockList = [MOCK_LOG];
            mockPrisma.dataProcessingLog.findMany.mockResolvedValue(mockList);
            mockPrisma.dataProcessingLog.count.mockResolvedValue(1);
            
            const mockReq = { query: { data_inicial: '2023-01-01', data_final: '2023-01-31' } };
            const mockRes = mockResponse();

            await getAllDataProcessingLogs(mockReq, mockRes);

            expect(mockPrisma.dataProcessingLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    created_at: {
                        gte: expect.any(Date),
                        lte: expect.any(Date)
                    }
                }
            }));
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('Deve retornar 500 se o banco falhar', async () => {
            mockPrisma.dataProcessingLog.findMany.mockRejectedValue(new Error('DB Error'));
            const mockReq = { query: {} };
            const mockRes = mockResponse();

            await getAllDataProcessingLogs(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getDataProcessingLogById', () => {
        it('Deve retornar 200 e o log se encontrado', async () => {
            mockPrisma.dataProcessingLog.findUnique.mockResolvedValue(MOCK_LOG);
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await getDataProcessingLogById(mockReq, mockRes);

            expect(mockPrisma.dataProcessingLog.findUnique).toHaveBeenCalledWith({ where: { id_log: 1 } });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(MOCK_LOG);
        });

        it('Deve retornar 404 se o log não for encontrado', async () => {
            mockPrisma.dataProcessingLog.findUnique.mockResolvedValue(null);
            const mockReq = { params: { id: '999' } };
            const mockRes = mockResponse();

            await getDataProcessingLogById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Log de processamento não encontrado" });
        });

        it('Deve retornar 500 se houver erro no banco', async () => {
            mockPrisma.dataProcessingLog.findUnique.mockRejectedValue(new Error('DB Error'));
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await getDataProcessingLogById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('deleteDataProcessingLog', () => {
        it('Deve retornar 204 ao deletar com sucesso', async () => {
            mockPrisma.dataProcessingLog.delete.mockResolvedValue(MOCK_LOG);
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await deleteDataProcessingLog(mockReq, mockRes);

            expect(mockPrisma.dataProcessingLog.delete).toHaveBeenCalledWith({ where: { id_log: 1 } });
            expect(mockRes.status).toHaveBeenCalledWith(204);
            expect(mockRes.send).toHaveBeenCalled();
        });

        it('Deve retornar 404 se o log não existir (P2025)', async () => {
            mockPrisma.dataProcessingLog.delete.mockRejectedValue({ code: 'P2025' });
            const mockReq = { params: { id: '999' } };
            const mockRes = mockResponse();

            await deleteDataProcessingLog(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Log não encontrado" });
        });

        it('Deve retornar 500 se houver erro no banco', async () => {
            mockPrisma.dataProcessingLog.delete.mockRejectedValue(new Error('DB Error'));
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await deleteDataProcessingLog(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });
});