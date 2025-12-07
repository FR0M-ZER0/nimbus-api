import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login } from '../../src/controllers/authController.js';
import { loginDTO } from '../../src/dto/authDTO.js';
import bcrypt from 'bcrypt'; 

const { mockPrisma } = vi.hoisted(() => {
    return {
        mockPrisma: {
            usuario: {
                findUnique: vi.fn(),
            },
        }
    }
});

vi.mock('../../src/generated/prisma/index.js', () => ({
    PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
}));

vi.mock('bcrypt', () => ({
    default: {
        compare: vi.fn(),
    },
    compare: vi.fn() 
}));

const mockResponse = () => {
    const res = {};
    res.status = vi.fn().mockReturnThis();
    res.json = vi.fn().mockReturnThis();
    return res;
};

// Spy no DTO
vi.spyOn(loginDTO, 'parse').mockImplementation((data) => data);

describe('authController - Testes Unitários', () => {

    const MOCK_LOGIN_DATA = { 
        email: 'admin@teste.com', 
        senha: 'senha123' 
    };

    const MOCK_USER_DB = {
        id_usuario: 1,
        nome: 'Admin User',
        email: 'admin@teste.com',
        senha: '$2b$10$fakehashfakehashfakehash',
        nivel_acesso: {
            descricao: 'Administrador'
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('login', () => {
        
        it('Deve realizar login com sucesso (Status 200) e retornar usuário sem senha', async () => {
            const mockReq = { body: MOCK_LOGIN_DATA };
            
            mockPrisma.usuario.findUnique.mockResolvedValue(MOCK_USER_DB);
            
            bcrypt.compare.mockResolvedValue(true);
            
            const mockRes = mockResponse();

            await login(mockReq, mockRes);

            // Verificações
            expect(loginDTO.parse).toHaveBeenCalledWith(mockReq.body);
            expect(mockPrisma.usuario.findUnique).toHaveBeenCalledWith({ 
                where: { email: MOCK_LOGIN_DATA.email },
                include: { nivel_acesso: true }
            });
            expect(bcrypt.compare).toHaveBeenCalledWith(MOCK_LOGIN_DATA.senha, MOCK_USER_DB.senha);
            
            expect(mockRes.status).toHaveBeenCalledWith(200);
            
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                email: MOCK_USER_DB.email,
                nome: MOCK_USER_DB.nome
            }));
            expect(mockRes.json).not.toHaveBeenCalledWith(expect.objectContaining({
                senha: expect.anything()
            }));
        });

        it('Deve retornar 400 se houver erro de validação no DTO', async () => {
            const mockReq = { body: {} };
            const validationError = { errors: [], format: () => 'Validation Error' };
            loginDTO.parse.mockImplementationOnce(() => { throw validationError; });
            
            const mockRes = mockResponse();

            await login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Erro de validação" }));
        });

        it('Deve retornar 401 se o usuário não for encontrado', async () => {
            const mockReq = { body: MOCK_LOGIN_DATA };
            
            mockPrisma.usuario.findUnique.mockResolvedValue(null);
            
            const mockRes = mockResponse();

            await login(mockReq, mockRes);

            expect(mockPrisma.usuario.findUnique).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Credenciais inválidas." });
        });

        it('Deve retornar 401 se a senha estiver incorreta', async () => {
            const mockReq = { body: MOCK_LOGIN_DATA };
            
            mockPrisma.usuario.findUnique.mockResolvedValue(MOCK_USER_DB);
            
            bcrypt.compare.mockResolvedValue(false);
            
            const mockRes = mockResponse();

            await login(mockReq, mockRes);

            expect(bcrypt.compare).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Credenciais inválidas." });
        });

        it('Deve retornar 403 se o usuário não for Administrador', async () => {
            const mockReq = { body: MOCK_LOGIN_DATA };
            
            const userComum = { 
                ...MOCK_USER_DB, 
                nivel_acesso: { descricao: 'Comum' } 
            };

            mockPrisma.usuario.findUnique.mockResolvedValue(userComum);
            bcrypt.compare.mockResolvedValue(true);
            
            const mockRes = mockResponse();

            await login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Acesso negado. Usuário não é administrador." });
        });

        it('Deve retornar 500 em caso de erro no banco de dados', async () => {
            const mockReq = { body: MOCK_LOGIN_DATA };
            mockPrisma.usuario.findUnique.mockRejectedValue(new Error('DB Connection Failed'));
            const mockRes = mockResponse();

            await login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Erro ao fazer login" }));
        });
    });
});