import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
    createTipoAlerta, 
    getAllTipoAlertas, 
    getTipoAlertaById, 
    updateTipoAlerta, 
    deleteTipoAlerta 
} from '../../src/controllers/alertTypeController.js';

import { createTipoAlertaDTO, updateTipoAlertaDTO } from '../../src/dto/tipoAlertaDTO.js';

const { mockPrisma } = vi.hoisted(() => {
    return {
        mockPrisma: {
            tipoAlerta: {
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

vi.spyOn(createTipoAlertaDTO, 'parse').mockImplementation((data) => data);
vi.spyOn(updateTipoAlertaDTO, 'parse').mockImplementation((data) => data);

beforeEach(() => {
    vi.clearAllMocks();
});

describe('tipoAlertaController - Testes Unitários', () => {

    const MOCK_ID = 1;
    const MOCK_TIPO_ALERTA = { 
        id: MOCK_ID, 
        operador: '>', 
        valor: 50.5 
    };

    describe('createTipoAlerta', () => {
        it('Deve retornar 201 e o tipo de alerta criado (SUCESSO)', async () => {
            const mockReq = { body: MOCK_TIPO_ALERTA };
            mockPrisma.tipoAlerta.create.mockResolvedValue(MOCK_TIPO_ALERTA);
            const mockRes = mockResponse();

            await createTipoAlerta(mockReq, mockRes);

            expect(createTipoAlertaDTO.parse).toHaveBeenCalledWith(mockReq.body);
            expect(mockPrisma.tipoAlerta.create).toHaveBeenCalledWith({
                data: {
                    operador: MOCK_TIPO_ALERTA.operador,
                    valor: MOCK_TIPO_ALERTA.valor,
                }
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(MOCK_TIPO_ALERTA);
        });

        it('Deve retornar 400 se houver erro de validação', async () => {
            const mockReq = { body: {} };
            // Simula estrutura de erro que o controller verifica (if error.errors)
            const validationError = { errors: [], format: () => 'Validation Error' };
            createTipoAlertaDTO.parse.mockImplementationOnce(() => { throw validationError; });
            const mockRes = mockResponse();

            await createTipoAlerta(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Erro de validação" }));
        });

        it('Deve retornar 500 em caso de erro genérico', async () => {
            const mockReq = { body: MOCK_TIPO_ALERTA };
            mockPrisma.tipoAlerta.create.mockRejectedValue(new Error('DB Error'));
            const mockRes = mockResponse();

            await createTipoAlerta(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getAllTipoAlertas', () => {
        it('Deve retornar 200 e a lista de tipos de alerta', async () => {
            const mockList = [MOCK_TIPO_ALERTA];
            mockPrisma.tipoAlerta.findMany.mockResolvedValue(mockList);
            const mockReq = {};
            const mockRes = mockResponse();

            await getAllTipoAlertas(mockReq, mockRes);

            expect(mockPrisma.tipoAlerta.findMany).toHaveBeenCalledWith(expect.objectContaining({
                include: { alertas: true },
                orderBy: { id: "asc" }
            }));
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockList);
        });

        it('Deve retornar 500 se o banco falhar', async () => {
            mockPrisma.tipoAlerta.findMany.mockRejectedValue(new Error('DB Error'));
            const mockReq = {};
            const mockRes = mockResponse();

            await getAllTipoAlertas(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getTipoAlertaById', () => {
        it('Deve retornar 200 e o tipo de alerta se encontrado', async () => {
            mockPrisma.tipoAlerta.findUnique.mockResolvedValue(MOCK_TIPO_ALERTA);
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await getTipoAlertaById(mockReq, mockRes);

            expect(mockPrisma.tipoAlerta.findUnique).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 1 }
            }));
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(MOCK_TIPO_ALERTA);
        });

        it('Deve retornar 404 se não encontrado', async () => {
            mockPrisma.tipoAlerta.findUnique.mockResolvedValue(null);
            const mockReq = { params: { id: '999' } };
            const mockRes = mockResponse();

            await getTipoAlertaById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Tipo de alerta não encontrado" });
        });
    });

    describe('updateTipoAlerta', () => {
        it('Deve retornar 200 e atualizar o tipo de alerta', async () => {
            const mockReq = { params: { id: '1' }, body: { operador: '<' } };
            const updatedData = { ...MOCK_TIPO_ALERTA, operador: '<' };
            
            mockPrisma.tipoAlerta.update.mockResolvedValue(updatedData);
            const mockRes = mockResponse();

            await updateTipoAlerta(mockReq, mockRes);

            expect(updateTipoAlertaDTO.parse).toHaveBeenCalled();
            expect(mockPrisma.tipoAlerta.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 1 },
                data: mockReq.body
            }));
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(updatedData);
        });

        it('Deve retornar 404 se o registro não existir (P2025)', async () => {
            const mockReq = { params: { id: '999' }, body: {} };
            mockPrisma.tipoAlerta.update.mockRejectedValue({ code: 'P2025' });
            const mockRes = mockResponse();

            await updateTipoAlerta(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Tipo de alerta não encontrado" });
        });
    });

    describe('deleteTipoAlerta', () => {
        it('Deve retornar 204 ao deletar com sucesso', async () => {
            mockPrisma.tipoAlerta.delete.mockResolvedValue(MOCK_TIPO_ALERTA);
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await deleteTipoAlerta(mockReq, mockRes);

            expect(mockPrisma.tipoAlerta.delete).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(mockRes.status).toHaveBeenCalledWith(204);
            expect(mockRes.send).toHaveBeenCalled();
        });

        it('Deve retornar 404 se o registro não existir (P2025)', async () => {
            mockPrisma.tipoAlerta.delete.mockRejectedValue({ code: 'P2025' });
            const mockReq = { params: { id: '999' } };
            const mockRes = mockResponse();

            await deleteTipoAlerta(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Tipo de alerta não encontrado" });
        });
    });
});