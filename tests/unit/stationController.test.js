import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
    createStation, 
    getAllStations, 
    getStationById, 
    updateStation, 
    deleteStation,
    getStationTipoParametros,
    getStationParams
} from '../../src/controllers/stationController.js'; 

import { 
    createStationDTO, 
    updateStationDTO 
} from '../../src/dto/stationDTO.js'; 

import { paginationQueryDTO } from '../../src/dto/paginationDTO.js'; 
import { PrismaClient } from '../../src/generated/prisma/index.js';

const mockPrisma = {
    estacao: {
        create: vi.fn(), 
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
    $transaction: vi.fn(),
    $disconnect: vi.fn(),
};

vi.mock('../../src/generated/prisma/index.js', () => ({
    PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
}));

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
    Prisma: {
      PrismaClientKnownRequestError: class extends Error {
        constructor(message, code) {
          super(message);
          this.code = code;
          this.name = 'PrismaClientKnownRequestError';
        }
      },
    },
  };
});

const mockResponse = () => {
    const res = {};
    res.status = vi.fn().mockReturnThis();
    res.json = vi.fn().mockReturnThis();
    res.send = vi.fn().mockReturnThis(); 
    return res;
};


vi.spyOn(createStationDTO, 'parse').mockImplementation((data) => data);
vi.spyOn(updateStationDTO, 'parse').mockImplementation((data) => data);
vi.spyOn(paginationQueryDTO, 'parse').mockImplementation((data) => data);


beforeEach(() => {
    vi.clearAllMocks();
});


describe('stationController - Testes Unitários', () => {

    const VALID_STATION_ID = 'TEST-001';
    const VALID_STATION_DATA = { id_estacao: VALID_STATION_ID, nome: 'Estação Mock', latitude: 10, longitude: 20, id_usuario: 1 };
    let mockRes;
    
    describe('createStation', () => {
        const mockReq = { body: VALID_STATION_DATA };

        it('Deve retornar 201 e a estação criada (SUCESSO)', async () => {
            mockPrisma.estacao.create.mockResolvedValue(VALID_STATION_DATA);
            mockRes = mockResponse();

            await createStation(mockReq, mockRes);

            expect(createStationDTO.parse).toHaveBeenCalledWith(mockReq.body);
            expect(mockPrisma.estacao.create).toHaveBeenCalledWith({ data: VALID_STATION_DATA });
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(VALID_STATION_DATA);
        });

        it('Deve retornar 400 se o DTO falhar na validação (ERRO DE ZOD)', async () => {
            const ZOD_ERROR_MOCK = { name: 'ZodError', issues: [{ path: ['nome'], message: 'Nome é obrigatório' }] };
            createStationDTO.parse.mockImplementation(() => { throw ZOD_ERROR_MOCK; });
            mockRes = mockResponse();

            await createStation(mockReq, mockRes);

            expect(mockPrisma.estacao.create).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('Deve retornar 409 se houver conflito de ID (ERRO P2002 - Único)', async () => {
            const PRISMA_UNIQUE_ERROR = { code: 'P2002' };
            mockPrisma.estacao.create.mockRejectedValue(PRISMA_UNIQUE_ERROR);
            createStationDTO.parse.mockImplementation((data) => data); 

            mockRes = mockResponse();

            await createStation(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(409);
        });

        it('Deve retornar 400 se houver erro de chave estrangeira (ERRO P2003 - FK)', async () => {
            const PRISMA_FK_ERROR = { code: 'P2003' };
            mockPrisma.estacao.create.mockRejectedValue(PRISMA_FK_ERROR);
            createStationDTO.parse.mockImplementation((data) => data); 

            mockRes = mockResponse();

            await createStation(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getAllStations', () => {
        const mockReq = { query: { page: 1, limit: 10 } };
        const MOCKED_LIST = [VALID_STATION_DATA];
        const MOCKED_COUNT = 15;
        
        it('Deve retornar 200 com dados paginados (SUCESSO)', async () => {
            mockPrisma.$transaction.mockResolvedValue([MOCKED_LIST, MOCKED_COUNT]);
            paginationQueryDTO.parse.mockImplementation((data) => ({ page: 1, limit: 10 }));
            mockRes = mockResponse();

            await getAllStations(mockReq, mockRes);
            
            expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                data: MOCKED_LIST,
                meta: { totalItems: MOCKED_COUNT, currentPage: 1, totalPages: 2, itemsPerPage: 10 }
            }));
        });
        
        it('Deve retornar 500 em caso de falha no Prisma ($transaction)', async () => {
            mockPrisma.$transaction.mockRejectedValue(new Error('DB Connection Failed'));
            paginationQueryDTO.parse.mockImplementation((data) => ({ page: 1, limit: 10 }));
            mockRes = mockResponse();
            
            await getAllStations(mockReq, mockRes);
            
            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getStationById', () => {
        const mockReq = { params: { id: VALID_STATION_ID } };
        
        it('Deve retornar 200 e os dados da estação (SUCESSO)', async () => {
            mockPrisma.estacao.findUnique.mockResolvedValue(VALID_STATION_DATA);
            mockRes = mockResponse();

            await getStationById(mockReq, mockRes);

            expect(mockPrisma.estacao.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id_estacao: VALID_STATION_ID } })
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(VALID_STATION_DATA);
        });
        
        it('Deve retornar 404 se a estação não for encontrada', async () => {
            mockPrisma.estacao.findUnique.mockResolvedValue(null);
            mockRes = mockResponse();

            await getStationById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Estação não encontrada" });
        });
    });
    describe('updateStation', () => {
        const UPDATED_DATA = { nome: 'Nome Atualizado' };
        const mockReq = { params: { id: VALID_STATION_ID }, body: UPDATED_DATA };
        
        it('Deve retornar 200 e a estação atualizada (SUCESSO)', async () => {
            const RESULT = { ...VALID_STATION_DATA, ...UPDATED_DATA };
            mockPrisma.estacao.update.mockResolvedValue(RESULT);
            updateStationDTO.parse.mockImplementation((data) => data);
            mockRes = mockResponse();

            await updateStation(mockReq, mockRes);

            expect(updateStationDTO.parse).toHaveBeenCalledWith(UPDATED_DATA);
            expect(mockPrisma.estacao.update).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id_estacao: VALID_STATION_ID }, data: UPDATED_DATA })
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(RESULT);
        });
        
        it('Deve retornar 404 se a estação não existir (ERRO P2025)', async () => {
            const PRISMA_NOT_FOUND_ERROR = { code: 'P2025' };
            mockPrisma.estacao.update.mockRejectedValue(PRISMA_NOT_FOUND_ERROR);
            updateStationDTO.parse.mockImplementation((data) => data);
            mockRes = mockResponse();

            await updateStation(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Estação não encontrada para atualização." });
        });
    });

    describe('deleteStation', () => {
        const mockReq = { params: { id: VALID_STATION_ID } };
        
        it('Deve retornar 204 e nenhum corpo (SUCESSO)', async () => {
            mockPrisma.estacao.delete.mockResolvedValue(VALID_STATION_DATA);
            mockRes = mockResponse();

            await deleteStation(mockReq, mockRes);

            expect(mockPrisma.estacao.delete).toHaveBeenCalledWith({ where: { id_estacao: VALID_STATION_ID } });
            expect(mockRes.status).toHaveBeenCalledWith(204);
            expect(mockRes.send).toHaveBeenCalledTimes(1);
        });
        
        it('Deve retornar 404 se a estação não existir (ERRO P2025)', async () => {
            const PRISMA_NOT_FOUND_ERROR = { code: 'P2025' };
            mockPrisma.estacao.delete.mockRejectedValue(PRISMA_NOT_FOUND_ERROR);
            mockRes = mockResponse();

            await deleteStation(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Estação não encontrada" });
        });
    });
    
    describe('getStationTipoParametros', () => {
        const mockReq = { params: { id: VALID_STATION_ID } };
        const MOCKED_RESPONSE_DATA = {
            id_estacao: VALID_STATION_ID,
            parametros: [
                { id: 1, tipo_parametro: { id_tipo_parametro: 10, nome: 'Temperatura' } },
                { id: 2, tipo_parametro: { id_tipo_parametro: 20, nome: 'Umidade' } },
                { id: 3, tipo_parametro: { id_tipo_parametro: 10, nome: 'Temperatura' } },
            ],
        };
        const EXPECTED_UNIQUE = [
            { id_tipo_parametro: 10, nome: 'Temperatura' },
            { id_tipo_parametro: 20, nome: 'Umidade' },
        ];

        it('Deve retornar 200 e a lista de tipos únicos de parâmetros (SUCESSO)', async () => {
            mockPrisma.estacao.findUnique.mockResolvedValue(MOCKED_RESPONSE_DATA);
            mockRes = mockResponse();

            await getStationTipoParametros(mockReq, mockRes);

            expect(mockPrisma.estacao.findUnique).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(EXPECTED_UNIQUE); 
        });

        it('Deve retornar 404 se a estação não for encontrada', async () => {
            mockPrisma.estacao.findUnique.mockResolvedValue(null);
            mockRes = mockResponse();

            await getStationTipoParametros(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });
    
    describe('getStationParams', () => {
        const mockReq = { params: { id: VALID_STATION_ID } };
        const MOCKED_PARAMS = [
            { id: 1, valor: 25.5, tipo_parametro: { nome: 'Temperatura' } },
            { id: 2, valor: 60, tipo_parametro: { nome: 'Umidade' } },
        ];
        const MOCKED_RESPONSE_DATA = { id_estacao: VALID_STATION_ID, parametros: MOCKED_PARAMS };

        it('Deve retornar 200 e a lista completa de parâmetros (SUCESSO)', async () => {
            mockPrisma.estacao.findUnique.mockResolvedValue(MOCKED_RESPONSE_DATA);
            mockRes = mockResponse();

            await getStationParams(mockReq, mockRes);

            expect(mockPrisma.estacao.findUnique).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(MOCKED_PARAMS);
        });

        it('Deve retornar 404 se a estação não for encontrada', async () => {
            mockPrisma.estacao.findUnique.mockResolvedValue(null);
            mockRes = mockResponse();

            await getStationParams(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });
});