import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();
let testStation;

describe('Testes das Rotas de Estações', () => {
    beforeEach(async () => {
        await prisma.estacao.deleteMany({});
        testStation = await prisma.estacao.create({
            data: {
                id_estacao: 101, 
                nome: 'Estação Padrão para Testes',
                latitude: 10.0,
                longitude: 20.0,
                id_usuario: 1,
            }
        });
    });

    afterAll(async () => {
        await prisma.estacao.deleteMany({});
        await prisma.$disconnect();
    });

    describe('POST /api/stations', () => {
        it('Deve criar uma nova estação com dados válidos e retornar status 201', async () => {
            const newStationData = {
                id_estacao: 999,
                nome: 'Estação Nova Criada no Teste',
                latitude: 45.0,
                longitude: 90.0,
                id_usuario: 1,
            };
            const response = await request(app).post('/api/stations').send(newStationData);
            expect(response.statusCode).toBe(201);
            expect(response.body.nome).toBe(newStationData.nome);
        });

        it('Deve retornar erro 400 se um campo obrigatório (nome) estiver faltando', async () => {
            const invalidStationData = { id_estacao: 998, latitude: 45.0, longitude: 90.0, id_usuario: 1 };
            const response = await request(app).post('/api/stations').send(invalidStationData);
            expect(response.statusCode).toBe(400);
            expect(response.body.errors[0].field).toBe('nome');
        });
    });

    describe('GET /api/stations', () => {
        it('Deve retornar uma lista paginada de estações e status 200', async () => {
            const response = await request(app).get('/api/stations?page=1&limit=5');
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
            expect(response.body.data.length).toBeLessThanOrEqual(5);
            expect(response.body.meta.currentPage).toBe(1);
        });

        it('Deve retornar um array vazio se a página pedida não tiver resultados', async () => {
            const response = await request(app).get('/api/stations?page=99');
            expect(response.statusCode).toBe(200);
            expect(response.body.data).toEqual([]);
            expect(response.body.meta.totalItems).toBe(1);
        });
    });

    describe('GET /api/stations/:id', () => {
        it('Deve retornar uma estação específica pelo ID e status 200', async () => {
            const response = await request(app).get(`/api/stations/${testStation.id_estacao}`);
            expect(response.statusCode).toBe(200);
            expect(response.body.id_estacao).toBe(testStation.id_estacao);
            expect(response.body.nome).toBe(testStation.nome);
        });

        it('Deve retornar erro 404 se a estação não for encontrada', async () => {
            const response = await request(app).get('/api/stations/99999');
            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe("Estação não encontrada");
        });
    });

    describe('PUT /api/stations/:id', () => {
        it('Deve atualizar uma estação com sucesso e retornar status 200', async () => {
            const updatedData = { nome: "Estação Padrão Atualizada" };
            const response = await request(app)
                .put(`/api/stations/${testStation.id_estacao}`)
                .send(updatedData);

            expect(response.statusCode).toBe(200);
            expect(response.body.nome).toBe(updatedData.nome);
        });

        it('Deve retornar erro 404 ao tentar atualizar uma estação que não existe', async () => {
            const updatedData = { nome: "Nome Fantasma" };
            const response = await request(app).put('/api/stations/99999').send(updatedData);
            expect(response.statusCode).toBe(404);
        });
    });

    describe('DELETE /api/stations/:id', () => {
        it('Deve deletar uma estação com sucesso e retornar status 204', async () => {
            const deleteResponse = await request(app).delete(`/api/stations/${testStation.id_estacao}`);
            expect(deleteResponse.statusCode).toBe(204);

            const getResponse = await request(app).get(`/api/stations/${testStation.id_estacao}`);
            expect(getResponse.statusCode).toBe(404);
        });

        it('Deve retornar erro 404 ao tentar deletar uma estação que não existe', async () => {
            const response = await request(app).delete('/api/stations/99999');
            expect(response.statusCode).toBe(404);
        });
    });
});
