import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
    createAlarme, 
    getAllAlarmes, 
    getAlarmeById, 
    getTodaysAlarme, 
    deleteAlarme 
} from '../../src/controllers/alarmController.js';

import { createAlarmeDTO } from '../../src/dto/alarmeDTO.js';

const { mockPrisma } = vi.hoisted(() => {
    return {
        mockPrisma: {
            alarme: {
                create: vi.fn(),
                findMany: vi.fn(),
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

vi.spyOn(createAlarmeDTO, 'parse').mockImplementation((data) => data);

describe('alarmeController - Testes Unitários', () => {
    
    const MOCK_ALARME = { 
        id_usuario: 1, 
        id_medida: 10, 
        id_alerta: 5, 
        created_at: new Date('2023-10-10T10:00:00Z') 
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2023-10-10T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('createAlarme', () => {
        it('Deve retornar 201 e o alarme criado (SUCESSO)', async () => {
            const mockReq = { body: MOCK_ALARME };
            mockPrisma.alarme.create.mockResolvedValue(MOCK_ALARME);
            const mockRes = mockResponse();

            await createAlarme(mockReq, mockRes);

            expect(createAlarmeDTO.parse).toHaveBeenCalledWith(mockReq.body);
            expect(mockPrisma.alarme.create).toHaveBeenCalledWith({
                data: {
                    id_usuario: MOCK_ALARME.id_usuario,
                    id_medida: MOCK_ALARME.id_medida,
                    id_alerta: MOCK_ALARME.id_alerta,
                }
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(MOCK_ALARME);
        });

        it('Deve retornar 400 se houver erro de validação', async () => {
            const mockReq = { body: {} };
            const validationError = { errors: [], format: () => 'Validation Error' };
            createAlarmeDTO.parse.mockImplementationOnce(() => { throw validationError; });
            const mockRes = mockResponse();

            await createAlarme(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Erro de validação" }));
        });

        it('Deve retornar 409 se houver erro de chave estrangeira (P2003)', async () => {
            const mockReq = { body: MOCK_ALARME };
            const prismaError = { code: 'P2003', meta: { field_name: 'id_usuario' } };
            mockPrisma.alarme.create.mockRejectedValue(prismaError);
            const mockRes = mockResponse();

            await createAlarme(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(409);
        });
    });

    describe('getAllAlarmes', () => {
        it('Deve retornar 200 e a lista de alarmes', async () => {
            const mockList = [MOCK_ALARME];
            mockPrisma.alarme.findMany.mockResolvedValue(mockList);
            const mockReq = {};
            const mockRes = mockResponse();

            await getAllAlarmes(mockReq, mockRes);

            expect(mockPrisma.alarme.findMany).toHaveBeenCalledWith(expect.objectContaining({
                orderBy: { created_at: "desc" }
            }));
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockList);
        });

        it('Deve retornar 500 se o banco falhar', async () => {
            mockPrisma.alarme.findMany.mockRejectedValue(new Error('DB Error'));
            const mockReq = {};
            const mockRes = mockResponse();

            await getAllAlarmes(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getAlarmeById', () => {
        const mockParams = { 
            id_usuario: '1', 
            id_medida: '10', 
            id_alerta: '5' 
        };

        it('Deve retornar 200 e o alarme se encontrado', async () => {
            mockPrisma.alarme.findUnique.mockResolvedValue(MOCK_ALARME);
            const mockReq = { params: mockParams };
            const mockRes = mockResponse();

            await getAlarmeById(mockReq, mockRes);

            expect(mockPrisma.alarme.findUnique).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    id_usuario_id_medida_id_alerta: {
                        id_usuario: 1,
                        id_medida: 10,
                        id_alerta: 5
                    }
                }
            }));
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(MOCK_ALARME);
        });

        it('Deve retornar 404 se o alarme não for encontrado', async () => {
            mockPrisma.alarme.findUnique.mockResolvedValue(null);
            const mockReq = { params: mockParams };
            const mockRes = mockResponse();

            await getAlarmeById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Alarme não encontrado" });
        });
    });

    describe('getTodaysAlarme', () => {
        it('Deve retornar 200 e filtrar alarmes pelo dia de hoje', async () => {
            const mockList = [MOCK_ALARME];
            mockPrisma.alarme.findMany.mockResolvedValue(mockList);
            const mockReq = {};
            const mockRes = mockResponse();

            await getTodaysAlarme(mockReq, mockRes);
            expect(mockPrisma.alarme.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    created_at: {
                        gte: expect.any(Date),
                        lte: expect.any(Date)
                    }
                }
            }));
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockList);
        });
    });

    describe('deleteAlarme', () => {
        const mockParams = { 
            id_usuario: '1', 
            id_medida: '10', 
            id_alerta: '5' 
        };

        it('Deve retornar 204 ao deletar com sucesso', async () => {
            mockPrisma.alarme.delete.mockResolvedValue(MOCK_ALARME);
            const mockReq = { params: mockParams };
            const mockRes = mockResponse();

            await deleteAlarme(mockReq, mockRes);

            expect(mockPrisma.alarme.delete).toHaveBeenCalledWith({
                where: {
                    id_usuario_id_medida_id_alerta: {
                        id_usuario: 1,
                        id_medida: 10,
                        id_alerta: 5
                    }
                }
            });
            expect(mockRes.status).toHaveBeenCalledWith(204);
            expect(mockRes.send).toHaveBeenCalled();
        });

        it('Deve retornar 404 se o alarme não existir (P2025)', async () => {
            mockPrisma.alarme.delete.mockRejectedValue({ code: 'P2025' });
            const mockReq = { params: mockParams };
            const mockRes = mockResponse();

            await deleteAlarme(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Alarme não encontrado" });
        });
    });
});