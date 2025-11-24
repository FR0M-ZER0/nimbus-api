import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMeasurementReport, getAlarmReport } from '../../src/controllers/relatorioPDFController.js';
import { reportQueryDTO } from '../../src/dto/reportDTO.js';
import * as pdfService from '../../src/services/pdfService.js';

const { mockPrisma } = vi.hoisted(() => {
    return {
        mockPrisma: {
            medida: { findMany: vi.fn() },
            alarme: { findMany: vi.fn() },
        }
    }
});

vi.mock('../../src/generated/prisma/index.js', () => ({
    PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
}));

vi.mock('../../src/services/pdfService.js', () => ({
    generatePDF: vi.fn(),
}));

const mockResponse = () => {
    const res = {};
    res.status = vi.fn().mockReturnThis();
    res.json = vi.fn().mockReturnThis();
    res.send = vi.fn().mockReturnThis();
    res.setHeader = vi.fn();
    res.headersSent = false;
    res.end = vi.fn();
    return res;
};

vi.spyOn(reportQueryDTO, 'parse').mockImplementation((data) => data);

beforeEach(() => {
    vi.clearAllMocks();
});

describe('relatorioPDFController - Testes Unitários', () => {

    const MOCK_START_DATE = new Date('2023-01-01T00:00:00Z');
    const MOCK_END_DATE = new Date('2023-01-02T00:00:00Z');
    const MOCK_START_UNIX = 1672531200; 
    const MOCK_END_UNIX = 1672617600;   

    const MOCK_QUERY = { 
        startDate: MOCK_START_DATE, 
        endDate: MOCK_END_DATE,
        id_estacao: 'TEST-01'
    };

    describe('getMeasurementReport', () => {
        it('Deve buscar dados convertendo datas para Unix e gerar PDF', async () => {
            const mockMedidas = [{ id: 1, valor: 10 }];
            mockPrisma.medida.findMany.mockResolvedValue(mockMedidas);
            
            const mockReq = { query: {} };
            reportQueryDTO.parse.mockReturnValue(MOCK_QUERY);
            const mockRes = mockResponse();

            await getMeasurementReport(mockReq, mockRes);

            expect(mockPrisma.medida.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    data_hora: {
                        gte: MOCK_START_UNIX,
                        lte: MOCK_END_UNIX
                    },
                    parametro: { id_estacao: 'TEST-01' }
                })
            }));

            expect(pdfService.generatePDF).toHaveBeenCalledWith(
                'Relatório Histórico de Medidas',
                MOCK_QUERY,
                mockMedidas,
                'medidas',
                mockRes
            );
        });

        it('Deve aplicar filtro de parâmetro se fornecido', async () => {
            const mockReq = { query: {} };
            reportQueryDTO.parse.mockReturnValue({ ...MOCK_QUERY, id_parametro: 5 });
            const mockRes = mockResponse();

            await getMeasurementReport(mockReq, mockRes);

            expect(mockPrisma.medida.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    id_parametro: 5
                })
            }));
        });

        it('Deve retornar 400 se o Zod falhar', async () => {
            const mockReq = { query: {} };
            const zodError = { name: 'ZodError', issues: [], format: () => {} };
            reportQueryDTO.parse.mockImplementationOnce(() => { throw zodError; });
            const mockRes = mockResponse();

            await getMeasurementReport(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ 
                message: "Erro de validação nos filtros." 
            }));
        });

        it('Deve retornar 500 se o banco falhar', async () => {
            reportQueryDTO.parse.mockReturnValue(MOCK_QUERY);
            mockPrisma.medida.findMany.mockRejectedValue(new Error('DB Error'));
            const mockReq = { query: {} };
            const mockRes = mockResponse();

            await getMeasurementReport(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getAlarmReport', () => {
        it('Deve buscar alarmes e chamar o serviço de PDF', async () => {
            const mockAlarmes = [{ id: 1 }];
            mockPrisma.alarme.findMany.mockResolvedValue(mockAlarmes);
            
            const mockReq = { query: {} };
            reportQueryDTO.parse.mockReturnValue(MOCK_QUERY);
            const mockRes = mockResponse();

            await getAlarmReport(mockReq, mockRes);

            expect(mockPrisma.alarme.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    created_at: {
                        gte: MOCK_START_DATE,
                        lte: MOCK_END_DATE
                    },
                    medida: {
                        parametro: { id_estacao: 'TEST-01' }
                    }
                })
            }));

            expect(pdfService.generatePDF).toHaveBeenCalledWith(
                'Relatório Histórico de Alarmes',
                MOCK_QUERY,
                mockAlarmes,
                'alarmes',
                mockRes
            );
        });

        it('Deve retornar 400 se o Zod falhar', async () => {
            const mockReq = { query: {} };
            const zodError = { name: 'ZodError', issues: [], format: () => {} };
            reportQueryDTO.parse.mockImplementationOnce(() => { throw zodError; });
            const mockRes = mockResponse();

            await getAlarmReport(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ 
                message: "Erro de validação nos filtros." 
            }));
        });

        it('Deve retornar 500 se o banco falhar', async () => {
            reportQueryDTO.parse.mockReturnValue(MOCK_QUERY);
            mockPrisma.alarme.findMany.mockRejectedValue(new Error('DB Error'));
            const mockReq = { query: {} };
            const mockRes = mockResponse();

            await getAlarmReport(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });
});