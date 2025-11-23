import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
    createEstacaoLog, 
    getAllEstacaoLogs, 
    getEstacaoLogById, 
    deleteEstacaoLog,
    getLogsByEstacao,
    getTotalDataSentToday
} from '../../src/controllers/stationLogController.js';

import { createEstacaoLogDTO } from '../../src/dto/estacaoLogDTO.js';

const { mockPrisma } = vi.hoisted(() => {
    return {
        mockPrisma: {
            estacaoLog: {
                create: vi.fn(),
                findMany: vi.fn(),
                count: vi.fn(),
                findUnique: vi.fn(),
                delete: vi.fn(),
                aggregate: vi.fn(),
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

vi.spyOn(createEstacaoLogDTO, 'parse').mockImplementation((data) => data);

describe('stationLogController - Testes Unitários', () => {

    const MOCK_DATE = new Date('2023-10-10T12:00:00Z');
    const MOCK_LOG = { 
        id_log: 1, 
        id_estacao: 'TEST-01', 
        data_sent: 500,
        created_at: MOCK_DATE 
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(MOCK_DATE);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('createEstacaoLog', () => {
        it('Deve retornar 201 e o log criado', async () => {
            const mockReq = { body: MOCK_LOG };
            mockPrisma.estacaoLog.create.mockResolvedValue(MOCK_LOG);
            const mockRes = mockResponse();

            await createEstacaoLog(mockReq, mockRes);

            expect(createEstacaoLogDTO.parse).toHaveBeenCalledWith(mockReq.body);
            expect(mockPrisma.estacaoLog.create).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(MOCK_LOG);
        });

        it('Deve retornar 400 se houver erro de validação', async () => {
            const mockReq = { body: {} };
            const validationError = { errors: [], format: () => 'Validation Error' };
            createEstacaoLogDTO.parse.mockImplementationOnce(() => { throw validationError; });
            const mockRes = mockResponse();

            await createEstacaoLog(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('Deve retornar 409 se a estação não existir (P2003)', async () => {
            const mockReq = { body: MOCK_LOG };
            const prismaError = { code: 'P2003', meta: { field_name: 'id_estacao' } };
            mockPrisma.estacaoLog.create.mockRejectedValue(prismaError);
            const mockRes = mockResponse();

            await createEstacaoLog(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(409);
        });

        it('Deve retornar 500 em caso de erro genérico', async () => {
            const mockReq = { body: MOCK_LOG };
            mockPrisma.estacaoLog.create.mockRejectedValue(new Error('DB Error'));
            const mockRes = mockResponse();

            await createEstacaoLog(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getAllEstacaoLogs', () => {
        it('Deve retornar 200 e a lista de logs com paginação e filtros', async () => {
            const mockList = [MOCK_LOG];
            mockPrisma.estacaoLog.findMany.mockResolvedValue(mockList);
            mockPrisma.estacaoLog.count.mockResolvedValue(1);
            
            const mockReq = { 
                query: { 
                    page: '1', 
                    limit: '10',
                    id_estacao: 'TEST-01',
                    data_min: '100',
                    data_inicial: '2023-01-01'
                } 
            };
            const mockRes = mockResponse();

            await getAllEstacaoLogs(mockReq, mockRes);

            expect(mockPrisma.estacaoLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    id_estacao: 'TEST-01',
                    data_sent: expect.any(Object),
                    created_at: expect.any(Object)
                }),
                take: 10
            }));
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                data: mockList
            }));
        });

        it('Deve retornar 500 se o banco falhar', async () => {
            mockPrisma.estacaoLog.findMany.mockRejectedValue(new Error('DB Error'));
            const mockReq = { query: {} };
            const mockRes = mockResponse();

            await getAllEstacaoLogs(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getEstacaoLogById', () => {
        it('Deve retornar 200 e o log se encontrado', async () => {
            mockPrisma.estacaoLog.findUnique.mockResolvedValue(MOCK_LOG);
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await getEstacaoLogById(mockReq, mockRes);

            expect(mockPrisma.estacaoLog.findUnique).toHaveBeenCalledWith(expect.objectContaining({
                where: { id_log: 1 }
            }));
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(MOCK_LOG);
        });

        it('Deve retornar 404 se não encontrado', async () => {
            mockPrisma.estacaoLog.findUnique.mockResolvedValue(null);
            const mockReq = { params: { id: '999' } };
            const mockRes = mockResponse();

            await getEstacaoLogById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('Deve retornar 500 se houver erro no banco', async () => {
            mockPrisma.estacaoLog.findUnique.mockRejectedValue(new Error('DB Error'));
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await getEstacaoLogById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('deleteEstacaoLog', () => {
        it('Deve retornar 204 ao deletar com sucesso', async () => {
            mockPrisma.estacaoLog.delete.mockResolvedValue(MOCK_LOG);
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await deleteEstacaoLog(mockReq, mockRes);

            expect(mockPrisma.estacaoLog.delete).toHaveBeenCalledWith({ where: { id_log: 1 } });
            expect(mockRes.status).toHaveBeenCalledWith(204);
        });

        it('Deve retornar 404 se não encontrado (P2025)', async () => {
            mockPrisma.estacaoLog.delete.mockRejectedValue({ code: 'P2025' });
            const mockReq = { params: { id: '999' } };
            const mockRes = mockResponse();

            await deleteEstacaoLog(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('Deve retornar 500 se houver erro no banco', async () => {
            mockPrisma.estacaoLog.delete.mockRejectedValue(new Error('DB Error'));
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await deleteEstacaoLog(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getLogsByEstacao', () => {
        it('Deve retornar 200 e a lista de logs da estação', async () => {
            const mockList = [MOCK_LOG];
            mockPrisma.estacaoLog.findMany.mockResolvedValue(mockList);
            mockPrisma.estacaoLog.count.mockResolvedValue(1);
            
            const mockReq = { params: { id_estacao: 'TEST-01' }, query: {} };
            const mockRes = mockResponse();

            await getLogsByEstacao(mockReq, mockRes);

            expect(mockPrisma.estacaoLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ id_estacao: 'TEST-01' })
            }));
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('Deve retornar 404 se a lista estiver vazia', async () => {
            mockPrisma.estacaoLog.findMany.mockResolvedValue([]);
            mockPrisma.estacaoLog.count.mockResolvedValue(0);
            
            const mockReq = { params: { id_estacao: 'TEST-01' }, query: {} };
            const mockRes = mockResponse();

            await getLogsByEstacao(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('Deve retornar 500 se houver erro no banco', async () => {
            mockPrisma.estacaoLog.findMany.mockRejectedValue(new Error('DB Error'));
            const mockReq = { params: { id_estacao: 'TEST-01' }, query: {} };
            const mockRes = mockResponse();

            await getLogsByEstacao(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getTotalDataSentToday', () => {
        it('Deve retornar 200 e o total de dados em MB', async () => {
            mockPrisma.estacaoLog.aggregate.mockResolvedValue({ _sum: { data_sent: 2048 } });
            const mockReq = {};
            const mockRes = mockResponse();

            await getTotalDataSentToday(mockReq, mockRes);

            expect(mockPrisma.estacaoLog.aggregate).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    created_at: {
                        gte: expect.any(Date),
                        lte: expect.any(Date)
                    }
                }
            }));
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ total_data_sent_mb: 2.00 })
            }));
        });

        it('Deve retornar 200 e 0 MB se não houver dados', async () => {
            mockPrisma.estacaoLog.aggregate.mockResolvedValue({ _sum: { data_sent: null } });
            const mockReq = {};
            const mockRes = mockResponse();

            await getTotalDataSentToday(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ total_data_sent_mb: 0 })
            }));
        });

        it('Deve retornar 500 se o banco falhar', async () => {
            mockPrisma.estacaoLog.aggregate.mockRejectedValue(new Error('DB Error'));
            const mockReq = {};
            const mockRes = mockResponse();

            await getTotalDataSentToday(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });
});