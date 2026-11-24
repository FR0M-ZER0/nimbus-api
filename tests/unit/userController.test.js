import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
    getAllUsuarios, 
    getUsuarioById, 
    createUsuario, 
    updateUsuario, 
    deleteUsuario 
} from '../../src/controllers/userController.js';

import bcrypt from 'bcrypt';

const { mockPrisma } = vi.hoisted(() => {
    return {
        mockPrisma: {
            usuario: {
                create: vi.fn(),
                findMany: vi.fn(),
                findUnique: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
                count: vi.fn(),
            },
        }
    }
});

vi.mock('../../src/generated/prisma/index.js', () => ({
    PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
}));

vi.mock('bcrypt', () => ({
    default: { hash: vi.fn() },
    hash: vi.fn(),
}));

vi.mock('../../src/dto/userDTO.js', () => {
    return {
        CreateUsuarioDto: vi.fn().mockImplementation((data) => {
            if (!data.email) throw { name: 'ValidationError', message: 'Email required' };
            return data;
        }),
        UpdateUsuarioDto: vi.fn().mockImplementation((data) => data),
    };
});

const mockResponse = () => {
    const res = {};
    res.status = vi.fn().mockReturnThis();
    res.json = vi.fn().mockReturnThis();
    return res;
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('userController - Testes Unitários', () => {

    const MOCK_USER = { 
        id_usuario: 1, 
        nome: 'User Teste', 
        email: 'teste@email.com', 
        senha: 'hashed_password',
        id_nivel_acesso: 1 
    };

    describe('createUsuario', () => {
        it('Deve retornar 201 e criar o usuário (SUCESSO)', async () => {
            const mockReq = { body: { nome: 'User', email: 'new@email.com', senha: '123', id_nivel_acesso: 1 } };
            
            mockPrisma.usuario.findUnique.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed_123');
            mockPrisma.usuario.create.mockResolvedValue({ ...MOCK_USER, email: 'new@email.com' });
            
            const mockRes = mockResponse();

            await createUsuario(mockReq, mockRes);

            expect(mockPrisma.usuario.findUnique).toHaveBeenCalledWith({ where: { email: 'new@email.com' } });
            expect(bcrypt.hash).toHaveBeenCalledWith('123', 10);
            expect(mockPrisma.usuario.create).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            
            expect(mockRes.json).toHaveBeenCalledWith(expect.not.objectContaining({ senha: expect.anything() }));
        });

        it('Deve retornar 409 se o email já existir', async () => {
            const mockReq = { body: { email: 'existente@email.com', senha: '123' } };
            mockPrisma.usuario.findUnique.mockResolvedValue(MOCK_USER);
            const mockRes = mockResponse();

            await createUsuario(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(409);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Email já existe' });
        });

        it('Deve retornar 400 se houver erro de validação (Simulado pelo DTO)', async () => {
            const mockReq = { body: {} }; 
            const mockRes = mockResponse();

            await createUsuario(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Erro de validação' }));
        });

        it('Deve retornar 500 em caso de erro genérico', async () => {
            const mockReq = { body: { email: 'a@a.com' } };
            mockPrisma.usuario.findUnique.mockRejectedValue(new Error('DB Error'));
            const mockRes = mockResponse();

            await createUsuario(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getAllUsuarios', () => {
        it('Deve retornar 200 e a lista paginada', async () => {
            const mockList = [MOCK_USER];
            mockPrisma.usuario.findMany.mockResolvedValue(mockList);
            mockPrisma.usuario.count.mockResolvedValue(1);
            
            const mockReq = { query: { page: '1', limit: '10', sort: 'nome', order: 'asc' } };
            const mockRes = mockResponse();

            await getAllUsuarios(mockReq, mockRes);

            expect(mockPrisma.usuario.findMany).toHaveBeenCalledWith(expect.objectContaining({
                skip: 0,
                take: 10,
                orderBy: { nome: 'asc' }
            }));
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                usuarios: mockList,
                pagination: expect.any(Object)
            }));
        });

        it('Deve retornar 400 se o campo de ordenação for inválido', async () => {
            const mockReq = { query: { sort: 'senha_secreta' } };
            const mockRes = mockResponse();

            await getAllUsuarios(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Campo de ordenação inválido') }));
        });

        it('Deve retornar 500 se o banco falhar', async () => {
            mockPrisma.usuario.findMany.mockRejectedValue(new Error('DB Error'));
            const mockReq = { query: {} };
            const mockRes = mockResponse();

            await getAllUsuarios(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getUsuarioById', () => {
        it('Deve retornar 200 e o usuário se encontrado', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue(MOCK_USER);
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await getUsuarioById(mockReq, mockRes);

            expect(mockPrisma.usuario.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id_usuario: 1 } }));
            expect(mockRes.json).toHaveBeenCalledWith(MOCK_USER);
        });

        it('Deve retornar 404 se o usuário não for encontrado', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue(null);
            const mockReq = { params: { id: '999' } };
            const mockRes = mockResponse();

            await getUsuarioById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Usuário não encontrado' });
        });
    });

    describe('updateUsuario', () => {
        it('Deve retornar 200 e atualizar o usuário', async () => {
            const mockReq = { params: { id: '1' }, body: { nome: 'Novo Nome' } };
            
            mockPrisma.usuario.findUnique.mockResolvedValue(MOCK_USER);
            mockPrisma.usuario.update.mockResolvedValue({ ...MOCK_USER, nome: 'Novo Nome' });
            
            const mockRes = mockResponse();

            await updateUsuario(mockReq, mockRes);

            expect(mockPrisma.usuario.update).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ nome: 'Novo Nome' }));
        });

        it('Deve retornar 404 se o usuário não existir', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue(null);
            const mockReq = { params: { id: '999' }, body: {} };
            const mockRes = mockResponse();

            await updateUsuario(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('Deve retornar 409 se tentar atualizar para um email já existente', async () => {
            const mockReq = { params: { id: '1' }, body: { email: 'outro@email.com' } };
            
            mockPrisma.usuario.findUnique
                .mockResolvedValueOnce(MOCK_USER)
                .mockResolvedValueOnce({ id: 2, email: 'outro@email.com' });

            const mockRes = mockResponse();

            await updateUsuario(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(409);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Email já existe' });
        });
    });

    describe('deleteUsuario', () => {
        it('Deve retornar 200 ao deletar com sucesso', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue(MOCK_USER);
            mockPrisma.usuario.delete.mockResolvedValue(MOCK_USER);
            
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await deleteUsuario(mockReq, mockRes);

            expect(mockPrisma.usuario.delete).toHaveBeenCalledWith({ where: { id_usuario: 1 } });
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Usuário excluído com sucesso' });
        });

        it('Deve retornar 404 se o usuário não existir', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue(null);
            const mockReq = { params: { id: '999' } };
            const mockRes = mockResponse();

            await deleteUsuario(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('Deve retornar 500 se houver erro no banco', async () => {
            mockPrisma.usuario.findUnique.mockRejectedValue(new Error('DB Error'));
            const mockReq = { params: { id: '1' } };
            const mockRes = mockResponse();

            await deleteUsuario(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });
});
