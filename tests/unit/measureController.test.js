import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ZodError } from 'zod';
import { 
    createMedida, 
    getAllMedidas, 
    getMedidaById, 
    getMedidasByParametro, 
    deleteMedida 
} from '../../src/controllers/measureController.js';

import { createMedidaDTO, medidaResponseDTO } from '../../src/dto/measureDTO.js';
import { paginationQueryDTO } from '../../src/dto/paginationDTO.js';

const { mockPrisma } = vi.hoisted(() => {
    return {
        mockPrisma: {
            medida: {
                create: vi.fn(),
                findMany: vi.fn(),
                count: vi.fn(),
                findUnique: vi.fn(),
                delete: vi.fn(),
            },
            parametro: {
                findUnique: vi.fn(),
            },
            $transaction: vi.fn(),
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

vi.spyOn(createMedidaDTO, 'parse').mockImplementation((data) => data);
vi.spyOn(medidaResponseDTO, 'parse').mockImplementation((data) => data);

const mockPaginationParse = vi.fn((data) => ({ page: 1, limit: 10, ...data }));
vi.spyOn(paginationQueryDTO, 'parse').mockImplementation(mockPaginationParse);
vi.spyOn(paginationQueryDTO, 'extend').mockReturnValue({
    parse: mockPaginationParse
});

describe('measureController - Testes Unitários', () => {

    const MOCK_DATE = new Date('2023-10-10T12:00:00Z');
    const MOCK_MEDIDA = { 
        id_medida: 1, 
        id_parametro: 10, 
        valor: 25.5, 
        data_hora: 1696939200 
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(MOCK_DATE);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('createMedida', () => {
        it('Deve retornar 201 e a medida criada', async () => {
            const mockReq = { body: MOCK_MEDIDA };
            mockPrisma.medida.create.mockResolvedValue(MOCK_MEDIDA);
            const mockRes = mockResponse();

            await createMedida(mockReq, mockRes);

            expect(createMedidaDTO.parse).toHaveBeenCalledWith(mockReq.body);
            expect(mockPrisma.medida.create).toHaveBeenCalledWith({ data: MOCK_MEDIDA });
            expect(medidaResponseDTO.parse).toHaveBeenCalledWith(MOCK_MEDIDA);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(MOCK_MEDIDA);
        });

        it('Deve retornar 400 se houver erro de validação Zod', async () => {
            const mockReq = { body: {} };
            const zodError = new ZodError([{ code: 'custom', path: ['valor'], message: 'Required' }]);
            createMedidaDTO.parse.mockImplementationOnce(() => { throw zodError; });
            const mockRes = mockResponse();

            await createMedida(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Erro de validação nos dados enviados.' }));
        });

        it('Deve retornar 400 se o parâmetro não existir (P2003)', async () => {
            const mockReq = { body: MOCK_MEDIDA };
            mockPrisma.medida.create.mockRejectedValue({ code: 'P2003' });
            const mockRes = mockResponse();

            await createMedida(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Erro de chave estrangeira: o parâmetro fornecido não existe.' }));
        });

        it('Deve retornar 500 em caso de erro genérico', async () => {
            const mockReq = { body: MOCK_MEDIDA };
            mockPrisma.medida.create.mockRejectedValue(new Error('DB Error'));
            const mockRes = mockResponse();

            await createMedida(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getAllMedidas', () => {
        it('Deve retornar 200 e a lista de medidas paginada', async () => {
            const mockList = [MOCK_MEDIDA];
            mockPrisma.$transaction.mockResolvedValue([mockList, 1]);
            const mockReq = { query: { page: '1', limit: '10' } };
            const mockRes = mockResponse();

            await getAllMedidas(mockReq, mockRes);

            expect(mockPrisma.medida.findMany).toHaveBeenCalled();
            expect(mockPrisma.medida.count).toHaveBeenCalled();
            expect(medidaResponseDTO.parse).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                data: mockList,
                meta: expect.any(Object)
            }));
        });

        it('Deve retornar 500 se a transação falhar', async () => {
            mockPrisma.$transaction.mockRejectedValue(new Error('DB Error'));
            const mockReq = { query: {} };
            const mockRes = mockResponse();

            await getAllMedidas(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getMedidaById', () => {
        it('Deve retornar 200 e a medida se encontrada', async () => {
            mockPrisma.medida.findUnique.mockResolvedValue(MOCK_MEDIDA);
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await getMedidaById(mockReq, mockRes);

            expect(mockPrisma.medida.findUnique).toHaveBeenCalledWith(expect.objectContaining({
                where: { id_medida: 1 }
            }));
            expect(medidaResponseDTO.parse).toHaveBeenCalledWith(MOCK_MEDIDA);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(MOCK_MEDIDA);
        });

        it('Deve retornar 404 se a medida não for encontrada', async () => {
            mockPrisma.medida.findUnique.mockResolvedValue(null);
            const mockReq = { params: { id: '999' } };
            const mockRes = mockResponse();

            await getMedidaById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Medida não encontrada.' });
        });

        it('Deve retornar 500 se houver erro no banco', async () => {
            mockPrisma.medida.findUnique.mockRejectedValue(new Error('DB Error'));
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await getMedidaById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getMedidasByParametro', () => {
        it('Deve retornar 200 e as medidas filtradas por data', async () => {
            mockPrisma.parametro.findUnique.mockResolvedValue({ id_parametro: 10 });
            mockPrisma.$transaction.mockResolvedValue([[MOCK_MEDIDA], 1]);
            
            const mockReq = { 
                params: { id: '10' }, 
                query: { page: '1', limit: '10', date: '10/10/2023' } 
            };
            const mockRes = mockResponse();

            await getMedidasByParametro(mockReq, mockRes);

            expect(mockPrisma.parametro.findUnique).toHaveBeenCalledWith({ where: { id_parametro: 10 } });
            expect(mockPrisma.medida.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    id_parametro: 10,
                    data_hora: {
                        gte: expect.any(Number),
                        lte: expect.any(Number)
                    }
                })
            }));
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                data: [MOCK_MEDIDA]
            }));
        });

        it('Deve retornar 404 se o parâmetro não existir', async () => {
            mockPrisma.parametro.findUnique.mockResolvedValue(null);
            const mockReq = { params: { id: '999' }, query: {} };
            const mockRes = mockResponse();

            await getMedidasByParametro(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Parâmetro não encontrado.' });
        });

        it('Deve usar a data atual se nenhuma data for fornecida', async () => {
            mockPrisma.parametro.findUnique.mockResolvedValue({ id_parametro: 10 });
            mockPrisma.$transaction.mockResolvedValue([[], 0]);
            
            const mockReq = { params: { id: '10' }, query: {} };
            const mockRes = mockResponse();

            await getMedidasByParametro(mockReq, mockRes);

            expect(mockPrisma.medida.findMany).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                meta: expect.objectContaining({ dateUsed: expect.stringMatching(/\d{2}\/\d{2}\/\d{4}/) })
            }));
        });

        it('Deve retornar 500 se ocorrer erro', async () => {
            mockPrisma.parametro.findUnique.mockRejectedValue(new Error('DB Error'));
            const mockReq = { params: { id: '10' }, query: {} };
            const mockRes = mockResponse();

            await getMedidasByParametro(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('deleteMedida', () => {
        it('Deve retornar 204 ao deletar com sucesso', async () => {
            mockPrisma.medida.delete.mockResolvedValue(MOCK_MEDIDA);
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await deleteMedida(mockReq, mockRes);

            expect(mockPrisma.medida.delete).toHaveBeenCalledWith({ where: { id_medida: 1 } });
            expect(mockRes.status).toHaveBeenCalledWith(204);
            expect(mockRes.send).toHaveBeenCalled();
        });

        it('Deve retornar 404 se a medida não existir (P2025)', async () => {
            mockPrisma.medida.delete.mockRejectedValue({ code: 'P2025' });
            const mockReq = { params: { id: '999' } };
            const mockRes = mockResponse();

            await deleteMedida(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Medida não encontrada.' });
        });

        it('Deve retornar 500 se houver erro no banco', async () => {
            mockPrisma.medida.delete.mockRejectedValue(new Error('DB Error'));
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await deleteMedida(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });
});