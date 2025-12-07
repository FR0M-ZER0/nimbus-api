import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
    createAlerta, 
    getAllAlertas, 
    getAlertaById, 
    updateAlerta, 
    deleteAlerta 
} from '../../src/controllers/alertaController.js';

import { createAlertaDTO, updateAlertaDTO } from '../../src/dto/alertaDTO.js';

const { mockPrisma } = vi.hoisted(() => {
    return {
        mockPrisma: {
            alerta: {
                create: vi.fn(),
                findMany: vi.fn(),
                findUnique: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
            },
            alertaUsuario: {
                createMany: vi.fn(),
                deleteMany: vi.fn(),
            },
            alarme: {
                deleteMany: vi.fn(),
            },
            usuario: {
                findMany: vi.fn(),
            },
            $transaction: vi.fn((callback) => callback),
        }
    }
});

vi.mock('../../src/generated/prisma/index.js', () => ({
    PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
}));

vi.mock('../../src/services/emailService.js', () => ({
    sendAlertEmail: vi.fn(),
}));

const mockResponse = () => {
    const res = {};
    res.status = vi.fn().mockReturnThis();
    res.json = vi.fn().mockReturnThis();
    res.send = vi.fn().mockReturnThis();
    return res;
};

vi.spyOn(createAlertaDTO, 'parse').mockImplementation((data) => data);
vi.spyOn(updateAlertaDTO, 'parse').mockImplementation((data) => data);

beforeEach(() => {
    vi.clearAllMocks();
});

describe('alertaController - Testes Unitários', () => {

    const MOCK_ALERTA_ID = 1;
    const MOCK_ALERTA_DATA = { 
        id_alerta: MOCK_ALERTA_ID, 
        titulo: 'Alerta Teste', 
        texto: 'Descrição teste', 
        id_tipo_alerta: 1, 
        id_parametro: 2 
    };

    describe('createAlerta', () => {
        it('Deve retornar 201 e criar o alerta (SUCESSO)', async () => {
            const mockReq = { body: { ...MOCK_ALERTA_DATA, usuarios: [] } };
            mockPrisma.alerta.create.mockResolvedValue(MOCK_ALERTA_DATA);
            const mockRes = mockResponse();

            await createAlerta(mockReq, mockRes);

            expect(createAlertaDTO.parse).toHaveBeenCalledWith(mockReq.body);
            expect(mockPrisma.alerta.create).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(MOCK_ALERTA_DATA);
        });

        it('Deve retornar 400 se ocorrer erro de validação (ZodError)', async () => {
            const mockReq = { body: {} };
            const mockZodError = { errors: [{ path: ['titulo'], message: 'Obrigatório' }], format: () => {} };
            createAlertaDTO.parse.mockImplementationOnce(() => { throw mockZodError; });
            const mockRes = mockResponse();

            await createAlerta(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Erro de validação' }));
        });

        it('Deve retornar 409 se houver erro de chave estrangeira (P2003)', async () => {
            const mockReq = { body: MOCK_ALERTA_DATA };
            const prismaError = { code: 'P2003', meta: { field_name: 'id_tipo_alerta' } };
            
            createAlertaDTO.parse.mockImplementation((data) => data);
            mockPrisma.alerta.create.mockRejectedValue(prismaError);
            
            const mockRes = mockResponse();

            await createAlerta(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(409);
        });
    });

    describe('getAllAlertas', () => {
        it('Deve retornar 200 e a lista de alertas', async () => {
            const mockList = [MOCK_ALERTA_DATA];
            mockPrisma.alerta.findMany.mockResolvedValue(mockList);
            const mockReq = {};
            const mockRes = mockResponse();

            await getAllAlertas(mockReq, mockRes);

            expect(mockPrisma.alerta.findMany).toHaveBeenCalledWith(expect.objectContaining({
                include: expect.any(Object),
                orderBy: { data_hora: "desc" }
            }));
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockList);
        });

        it('Deve retornar 500 se o banco falhar', async () => {
            mockPrisma.alerta.findMany.mockRejectedValue(new Error('DB Error'));
            const mockReq = {};
            const mockRes = mockResponse();

            await getAllAlertas(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getAlertaById', () => {
        it('Deve retornar 200 e o alerta se encontrado', async () => {
            mockPrisma.alerta.findUnique.mockResolvedValue(MOCK_ALERTA_DATA);
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await getAlertaById(mockReq, mockRes);

            expect(mockPrisma.alerta.findUnique).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(MOCK_ALERTA_DATA);
        });

        it('Deve retornar 404 se o alerta não existir', async () => {
            mockPrisma.alerta.findUnique.mockResolvedValue(null);
            const mockReq = { params: { id: '999' } };
            const mockRes = mockResponse();

            await getAlertaById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Alerta não encontrado" });
        });
    });

    describe('updateAlerta', () => {
        it('Deve retornar 200 e atualizar o alerta', async () => {
            const mockReq = { params: { id: '1' }, body: { titulo: 'Novo Titulo' } };
            mockPrisma.alerta.update.mockResolvedValue({ ...MOCK_ALERTA_DATA, titulo: 'Novo Titulo' });
            mockPrisma.alerta.findUnique.mockResolvedValue({ ...MOCK_ALERTA_DATA, titulo: 'Novo Titulo' });
            
            const mockRes = mockResponse();

            await updateAlerta(mockReq, mockRes);

            expect(updateAlertaDTO.parse).toHaveBeenCalled();
            expect(mockPrisma.alerta.update).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('Deve retornar 404 se tentar atualizar alerta inexistente (P2025)', async () => {
            const mockReq = { params: { id: '999' }, body: {} };
            mockPrisma.alerta.update.mockRejectedValue({ code: 'P2025' });
            const mockRes = mockResponse();

            await updateAlerta(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

    describe('deleteAlerta', () => {
        it('Deve retornar 204 ao deletar com sucesso', async () => {
            mockPrisma.$transaction.mockImplementation(async (promises) => {
                return promises; 
            });
            
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await deleteAlerta(mockReq, mockRes);

            expect(mockPrisma.alertaUsuario.deleteMany).toHaveBeenCalled();
            expect(mockPrisma.alarme.deleteMany).toHaveBeenCalled();
            expect(mockPrisma.alerta.delete).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(204);
            expect(mockRes.send).toHaveBeenCalled();
        });

        it('Deve retornar 404 se o alerta não existir (P2025)', async () => {
            mockPrisma.$transaction.mockRejectedValue({ code: 'P2025' });
            const mockReq = { params: { id: '999' } };
            const mockRes = mockResponse();

            await deleteAlerta(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });
});