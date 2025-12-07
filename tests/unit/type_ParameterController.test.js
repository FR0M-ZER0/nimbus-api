import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
    createTipoParametro, 
    getAllTipoParametro, 
    getTipoParametroById, 
    updateTipoParametro, 
    deleteTipoParametro 
} from '../../src/controllers/type_ParameterController.js';

import { createTipoParametroDTO, updateTipoParametroDTO } from '../../src/dto/type_ParameterDTO.js';

const { mockPrisma } = vi.hoisted(() => {
    return {
        mockPrisma: {
            tipoParametro: {
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

vi.spyOn(createTipoParametroDTO, 'parse').mockImplementation((data) => data);
vi.spyOn(updateTipoParametroDTO, 'parse').mockImplementation((data) => data);

beforeEach(() => {
    vi.clearAllMocks();
});

describe('type_ParameterController - Testes Unitários', () => {

    const MOCK_ID = 1;
    const MOCK_TIPO = { 
        id_tipo_parametro: MOCK_ID, 
        nome: 'Temperatura', 
        unidade: '°C' 
    };

    describe('createTipoParametro', () => {
        it('Deve retornar 201 e o tipo de parâmetro criado', async () => {
            const mockReq = { body: MOCK_TIPO };
            mockPrisma.tipoParametro.create.mockResolvedValue(MOCK_TIPO);
            const mockRes = mockResponse();

            await createTipoParametro(mockReq, mockRes);

            expect(createTipoParametroDTO.parse).toHaveBeenCalledWith(mockReq.body);
            expect(mockPrisma.tipoParametro.create).toHaveBeenCalledWith({ data: mockReq.body });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(MOCK_TIPO);
        });

        it('Deve retornar 400 se houver erro de validação ou erro genérico', async () => {
            const mockReq = { body: {} };
            const error = { errors: ['Erro de validação'] };
            createTipoParametroDTO.parse.mockImplementationOnce(() => { throw error; });
            const mockRes = mockResponse();

            await createTipoParametro(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: error.errors });
        });
    });

    describe('getAllTipoParametro', () => {
        it('Deve retornar 200 (implícito) e a lista de tipos', async () => {
            const mockList = [MOCK_TIPO];
            mockPrisma.tipoParametro.findMany.mockResolvedValue(mockList);
            const mockReq = {};
            const mockRes = mockResponse();

            await getAllTipoParametro(mockReq, mockRes);

            expect(mockPrisma.tipoParametro.findMany).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith(mockList);
        });

        it('Deve retornar 500 se o banco falhar', async () => {
            mockPrisma.tipoParametro.findMany.mockRejectedValue(new Error('DB Error'));
            const mockReq = {};
            const mockRes = mockResponse();

            await getAllTipoParametro(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'DB Error' });
        });
    });

    describe('getTipoParametroById', () => {
        it('Deve retornar 200 (implícito) e o tipo se encontrado', async () => {
            mockPrisma.tipoParametro.findUnique.mockResolvedValue(MOCK_TIPO);
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await getTipoParametroById(mockReq, mockRes);

            expect(mockPrisma.tipoParametro.findUnique).toHaveBeenCalledWith({ 
                where: { id_tipo_parametro: 1 } 
            });
            expect(mockRes.json).toHaveBeenCalledWith(MOCK_TIPO);
        });

        it('Deve retornar 404 se não encontrado', async () => {
            mockPrisma.tipoParametro.findUnique.mockResolvedValue(null);
            const mockReq = { params: { id: '999' } };
            const mockRes = mockResponse();

            await getTipoParametroById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: "TipoParametro não encontrado" });
        });

        it('Deve retornar 500 se houver erro no banco', async () => {
            mockPrisma.tipoParametro.findUnique.mockRejectedValue(new Error('DB Error'));
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await getTipoParametroById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'DB Error' });
        });
    });

    describe('updateTipoParametro', () => {
        it('Deve retornar 200 (implícito) e o tipo atualizado', async () => {
            const mockReq = { params: { id: '1' }, body: { nome: 'Novo Nome' } };
            const updatedData = { ...MOCK_TIPO, nome: 'Novo Nome' };
            
            mockPrisma.tipoParametro.update.mockResolvedValue(updatedData);
            const mockRes = mockResponse();

            await updateTipoParametro(mockReq, mockRes);

            expect(updateTipoParametroDTO.parse).toHaveBeenCalled();
            expect(mockPrisma.tipoParametro.update).toHaveBeenCalledWith({
                where: { id_tipo_parametro: 1 },
                data: mockReq.body
            });
            expect(mockRes.json).toHaveBeenCalledWith(updatedData);
        });

        it('Deve retornar 400 se houver erro de validação ou erro no update', async () => {
            const mockReq = { params: { id: '1' }, body: {} };
            const error = { message: 'Erro de update' };
            mockPrisma.tipoParametro.update.mockRejectedValue(error);
            const mockRes = mockResponse();

            await updateTipoParametro(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Erro de update' });
        });
    });

    describe('deleteTipoParametro', () => {
        it('Deve retornar 200 (implícito) e mensagem de sucesso', async () => {
            mockPrisma.tipoParametro.delete.mockResolvedValue(MOCK_TIPO);
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await deleteTipoParametro(mockReq, mockRes);

            expect(mockPrisma.tipoParametro.delete).toHaveBeenCalledWith({ 
                where: { id_tipo_parametro: 1 } 
            });
            expect(mockRes.json).toHaveBeenCalledWith({ message: "TipoParametro deletado com sucesso" });
        });

        it('Deve retornar 500 se houver erro ao deletar', async () => {
            mockPrisma.tipoParametro.delete.mockRejectedValue(new Error('DB Error'));
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await deleteTipoParametro(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'DB Error' });
        });
    });
});