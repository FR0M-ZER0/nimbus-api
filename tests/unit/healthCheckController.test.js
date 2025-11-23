import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { healthCheck } from '../../src/controllers/healthCheckController.js';

const mockResponse = () => {
    const res = {};
    res.status = vi.fn().mockReturnThis();
    res.json = vi.fn().mockReturnThis();
    return res;
};

describe('healthCheckController - Testes Unitários', () => {
    
    const MOCK_DATE = new Date('2025-01-01T12:00:00Z');
    const MOCK_UPTIME = 100.5;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(MOCK_DATE);
        vi.spyOn(process, 'uptime').mockReturnValue(MOCK_UPTIME);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('Deve retornar 200 e o status do sistema (SUCESSO)', async () => {
        const mockReq = {};
        const mockRes = mockResponse();

        await healthCheck(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            status: "ok",
            uptime: MOCK_UPTIME,
            timestamp: MOCK_DATE.toISOString(),
            _links: {
                self: { href: '/health', method: 'GET' }
            }
        });
    });

    it('Deve retornar 500 se ocorrer um erro inesperado', async () => {
        const mockReq = { originalUrl: '/health' };
        const mockRes = mockResponse();
        
        vi.spyOn(process, 'uptime').mockImplementation(() => {
            throw new Error('Erro de sistema simulado');
        });

        await healthCheck(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
            title: "Internal Server Error",
            status: 500,
            detail: "Erro de sistema simulado",
            instance: '/health'
        });
    });
});