import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
    createEstacaoStatus,
    getAllEstacaoStatus,
    getEstacaoStatusById,
    deleteEstacaoStatus,
    getStatusByEstacao,
    getLastStatusByEstacao,
    getEstacoesStatusByOnOff,
    getActivityHistory,
    getActivityHistoryAll
} from '../../src/controllers/estacaoStatusController.js';

import { createEstacaoStatusDTO } from '../../src/dto/estacaoStatusDTO.js';

const { mockPrisma } = vi.hoisted(() => {
    return {
        mockPrisma: {
            estacaoStatus: {
                create: vi.fn(),
                findMany: vi.fn(),
                count: vi.fn(),
                findUnique: vi.fn(),
                delete: vi.fn(),
                findFirst: vi.fn(),
            },
            estacaoLog: {
                findMany: vi.fn(),
                count: vi.fn(),
            },
            dataProcessingLog: {
                findMany: vi.fn(),
                count: vi.fn(),
            },
            $queryRaw: vi.fn(),
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

vi.spyOn(createEstacaoStatusDTO, 'parse').mockImplementation((data) => data);

beforeEach(() => {
    vi.clearAllMocks();
});

describe('estacaoStatusController - Testes Unitários', () => {

    const MOCK_DATE = new Date('2023-10-10T12:00:00Z');
    const MOCK_STATUS = { 
        id_status: 1, 
        id_estacao: 'TEST-01', 
        status: 'ONLINE', 
        created_at: MOCK_DATE 
    };

    describe('createEstacaoStatus', () => {
        it('Deve retornar 201 e o status criado', async () => {
            const mockReq = { body: MOCK_STATUS };
            mockPrisma.estacaoStatus.create.mockResolvedValue(MOCK_STATUS);
            const mockRes = mockResponse();

            await createEstacaoStatus(mockReq, mockRes);

            expect(createEstacaoStatusDTO.parse).toHaveBeenCalledWith(mockReq.body);
            expect(mockPrisma.estacaoStatus.create).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(MOCK_STATUS);
        });

        it('Deve retornar 400 se houver erro de validação', async () => {
            const mockReq = { body: {} };
            const validationError = { errors: [], format: () => 'Validation Error' };
            createEstacaoStatusDTO.parse.mockImplementationOnce(() => { throw validationError; });
            const mockRes = mockResponse();

            await createEstacaoStatus(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('Deve retornar 409 se a estação não existir (P2003)', async () => {
            const mockReq = { body: MOCK_STATUS };
            const prismaError = { code: 'P2003', meta: { field_name: 'id_estacao' } };
            mockPrisma.estacaoStatus.create.mockRejectedValue(prismaError);
            const mockRes = mockResponse();

            await createEstacaoStatus(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(409);
        });

        it('Deve retornar 500 em caso de erro genérico', async () => {
            const mockReq = { body: MOCK_STATUS };
            mockPrisma.estacaoStatus.create.mockRejectedValue(new Error('DB Error'));
            const mockRes = mockResponse();

            await createEstacaoStatus(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getAllEstacaoStatus', () => {
        it('Deve retornar 200 e a lista com filtros e paginação', async () => {
            const mockList = [MOCK_STATUS];
            mockPrisma.estacaoStatus.count.mockResolvedValue(1);
            mockPrisma.estacaoStatus.findMany.mockResolvedValue(mockList);
            
            const mockReq = { 
                query: { 
                    page: '1', 
                    perPage: '10', 
                    status: 'ONLINE',
                    id_estacao: 'TEST-01',
                    date_from: '2023-01-01',
                    sort: 'status',
                    order: 'asc'
                } 
            };
            const mockRes = mockResponse();

            await getAllEstacaoStatus(mockReq, mockRes);

            expect(mockPrisma.estacaoStatus.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    status: 'ONLINE',
                    id_estacao: 'TEST-01',
                    created_at: expect.any(Object)
                }),
                orderBy: { status: 'asc' },
                take: 10
            }));
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                data: mockList,
                meta: expect.anything()
            }));
        });

        it('Deve retornar 500 se o banco falhar', async () => {
            mockPrisma.estacaoStatus.count.mockRejectedValue(new Error('DB Error'));
            const mockReq = { query: {} };
            const mockRes = mockResponse();

            await getAllEstacaoStatus(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getEstacaoStatusById', () => {
        it('Deve retornar 200 e o status se encontrado', async () => {
            mockPrisma.estacaoStatus.findUnique.mockResolvedValue(MOCK_STATUS);
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await getEstacaoStatusById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(MOCK_STATUS);
        });

        it('Deve retornar 400 se o ID for inválido', async () => {
            const mockReq = { params: { id: 'abc' } };
            const mockRes = mockResponse();

            await getEstacaoStatusById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('Deve retornar 404 se não encontrado', async () => {
            mockPrisma.estacaoStatus.findUnique.mockResolvedValue(null);
            const mockReq = { params: { id: '999' } };
            const mockRes = mockResponse();

            await getEstacaoStatusById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

    describe('deleteEstacaoStatus', () => {
        it('Deve retornar 204 ao deletar com sucesso', async () => {
            mockPrisma.estacaoStatus.delete.mockResolvedValue(MOCK_STATUS);
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await deleteEstacaoStatus(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(204);
        });

        it('Deve retornar 400 se o ID for inválido', async () => {
            const mockReq = { params: { id: 'abc' } };
            const mockRes = mockResponse();

            await deleteEstacaoStatus(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('Deve retornar 404 se não encontrado (P2025)', async () => {
            mockPrisma.estacaoStatus.delete.mockRejectedValue({ code: 'P2025' });
            const mockReq = { params: { id: '999' } };
            const mockRes = mockResponse();

            await deleteEstacaoStatus(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

    describe('getStatusByEstacao', () => {
        it('Deve retornar 200 e a lista de status da estação', async () => {
            const mockList = [MOCK_STATUS];
            mockPrisma.estacaoStatus.findMany.mockResolvedValue(mockList);
            mockPrisma.estacaoStatus.count.mockResolvedValue(1);
            
            const mockReq = { params: { id_estacao: 'TEST-01' }, query: {} };
            const mockRes = mockResponse();

            await getStatusByEstacao(mockReq, mockRes);

            expect(mockPrisma.estacaoStatus.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ id_estacao: 'TEST-01' })
            }));
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('Deve retornar 404 se a lista estiver vazia', async () => {
            mockPrisma.estacaoStatus.findMany.mockResolvedValue([]);
            mockPrisma.estacaoStatus.count.mockResolvedValue(0);
            
            const mockReq = { params: { id_estacao: 'TEST-01' }, query: {} };
            const mockRes = mockResponse();

            await getStatusByEstacao(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

    describe('getLastStatusByEstacao', () => {
        it('Deve retornar 200 e o último status', async () => {
            mockPrisma.estacaoStatus.findFirst.mockResolvedValue(MOCK_STATUS);
            const mockReq = { params: { id_estacao: 'TEST-01' } };
            const mockRes = mockResponse();

            await getLastStatusByEstacao(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(MOCK_STATUS);
        });

        it('Deve retornar 404 se nenhum status for encontrado', async () => {
            mockPrisma.estacaoStatus.findFirst.mockResolvedValue(null);
            const mockReq = { params: { id_estacao: 'TEST-01' } };
            const mockRes = mockResponse();

            await getLastStatusByEstacao(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

    describe('getEstacoesStatusByOnOff', () => {
        it('Deve retornar 200 com a contagem de online e offline', async () => {
            const rawData = [
                { id_estacao: '1', status: 'ONLINE' },
                { id_estacao: '2', status: 'OFFLINE' },
                { id_estacao: '3', status: 'ONLINE' }
            ];
            mockPrisma.$queryRaw.mockResolvedValue(rawData);
            const mockReq = {};
            const mockRes = mockResponse();

            await getEstacoesStatusByOnOff(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                online: 2,
                offline: 1,
                total: 3
            }));
        });

        it('Deve retornar 500 em caso de erro no queryRaw', async () => {
            mockPrisma.$queryRaw.mockRejectedValue(new Error('DB Error'));
            const mockReq = {};
            const mockRes = mockResponse();

            await getEstacoesStatusByOnOff(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getActivityHistory', () => {
        it('Deve retornar 200 com histórico combinado e ordenado', async () => {
            const statusList = [{ created_at: new Date('2023-01-03'), id_estacao: 'A', status: 'ONLINE' }];
            const logList = [{ created_at: new Date('2023-01-02'), id_estacao: 'B' }];
            const procList = [{ created_at: new Date('2023-01-01') }];

            mockPrisma.estacaoStatus.findMany.mockResolvedValue(statusList);
            mockPrisma.estacaoLog.findMany.mockResolvedValue(logList);
            mockPrisma.dataProcessingLog.findMany.mockResolvedValue(procList);

            const mockReq = {};
            const mockRes = mockResponse();

            await getActivityHistory(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                history: expect.any(Array)
            }));
        });
    });

    describe('getActivityHistoryAll', () => {
        it('Deve retornar 200 com histórico paginado, filtrado e formatado', async () => {
            const statusList = [{ created_at: MOCK_DATE, id_estacao: 'A', status: 'ONLINE' }];
            const logList = [{ created_at: MOCK_DATE, id_estacao: 'B' }];
            const procList = [{ created_at: MOCK_DATE }];

            mockPrisma.estacaoStatus.count.mockResolvedValue(1);
            mockPrisma.estacaoLog.count.mockResolvedValue(1);
            mockPrisma.dataProcessingLog.count.mockResolvedValue(1);

            mockPrisma.estacaoStatus.findMany.mockResolvedValue(statusList);
            mockPrisma.estacaoLog.findMany.mockResolvedValue(logList);
            mockPrisma.dataProcessingLog.findMany.mockResolvedValue(procList);

            const mockReq = { query: { page: 1, limit: 10, search: 'A', status: 'info', orderBy: 'oldest' } };
            const mockRes = mockResponse();

            await getActivityHistoryAll(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                total: expect.any(Number),
                history: expect.any(Array)
            }));
        });

        it('Deve retornar 500 se falhar', async () => {
            mockPrisma.estacaoStatus.count.mockRejectedValue(new Error('Error'));
            const mockReq = { query: {} };
            const mockRes = mockResponse();

            await getActivityHistoryAll(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });
});