import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js'; // Ajuste o caminho para o seu arquivo principal da aplicação
import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

// Variáveis para armazenar os dados criados para os testes
let testUser;
let testTipoAlerta;
let testAlerta;

describe('Testes das Rotas de Alertas', () => {
    // Antes de cada teste, limpa o banco e cria os dados necessários (usuário, tipo de alerta, etc.)
    beforeEach(async () => {
        // Limpa as tabelas na ordem correta para evitar erros de chave estrangeira
        await prisma.alerta.deleteMany({});
        await prisma.tipoAlerta.deleteMany({});
        await prisma.parametro.deleteMany({});
        await prisma.tipoParametro.deleteMany({});
        await prisma.estacao.deleteMany({});
        await prisma.usuario.deleteMany({});
        
        // Cria um usuário para ser o dono do alerta
        testUser = await prisma.usuario.create({
            data: {
                nome: 'Usuario Teste Alerta',
                email: 'alerta@teste.com',
                senha: '123',
                id_nivel_acesso: 1, // Supondo que o nível de acesso 1 exista
            }
        });

        // Cria dados relacionados necessários para o TipoAlerta
        const tipoParametro = await prisma.tipoParametro.create({
            data: { nome: 'Temperatura Teste', unidade: 'C' }
        });
        const estacao = await prisma.estacao.create({
            data: { id_estacao: 101, nome: 'Estação Alerta Teste', latitude: 1, longitude: 1, id_usuario: testUser.id_usuario }
        });
        const parametro = await prisma.parametro.create({
            data: { id_parametro: 101, id_estacao: estacao.id_estacao, id_tipo_parametro: tipoParametro.id_tipo_parametro, json: {} }
        });

        // Cria um tipo de alerta (a "regra")
        testTipoAlerta = await prisma.tipoAlerta.create({
            data: {
                operador: '>',
                valor: 30,
                id_parametro: parametro.id_parametro,
            }
        });

        // Cria um alerta de exemplo para ser usado nos testes GET, PUT, DELETE
        testAlerta = await prisma.alerta.create({
            data: {
                mensagem: 'Este é um alerta de teste inicial.',
                id_usuario: testUser.id_usuario,
                id_tipo_alerta: testTipoAlerta.id,
            }
        });
    });

    // Ao final de todos os testes, limpa o banco e desconecta o Prisma
    afterAll(async () => {
        await prisma.alerta.deleteMany({});
        await prisma.tipoAlerta.deleteMany({});
        await prisma.parametro.deleteMany({});
        await prisma.tipoParametro.deleteMany({});
        await prisma.estacao.deleteMany({});
        await prisma.usuario.deleteMany({});
        await prisma.$disconnect();
    });

    describe('POST /alerts', () => {
        it('Deve criar um novo alerta com dados válidos e retornar status 201', async () => {
            const newAlertaData = {
                id_tipo_alerta: testTipoAlerta.id,
                id_usuario: testUser.id_usuario,
                mensagem: 'Alerta recém-criado pelo teste!',
            };
            const response = await request(app).post('/alertas').send(newAlertaData);
            expect(response.statusCode).toBe(201);
            expect(response.body.mensagem).toBe(newAlertaData.mensagem);
        });

        it('Deve retornar erro 400 se um campo obrigatório (mensagem) estiver faltando', async () => {
            const invalidAlertaData = {
                id_tipo_alerta: testTipoAlerta.id,
                id_usuario: testUser.id_usuario,
            };
            const response = await request(app).post('/alertas').send(invalidAlertaData);
            expect(response.statusCode).toBe(400);
            expect(response.body.issues).toBeDefined(); // Verifica se o erro do Zod foi retornado
        });
    });

    describe('GET /alerts', () => {
        it('Deve retornar uma lista de alertas e status 200', async () => {
            const response = await request(app).get('/alertas');
            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });
    });

    describe('GET /alerts/:id', () => {
        it('Deve retornar um alerta específico pelo ID e status 200', async () => {
            const response = await request(app).get(`/alertas/${testAlerta.id_alerta}`);
            expect(response.statusCode).toBe(200);
            expect(response.body.id_alerta).toBe(testAlerta.id_alerta);
            expect(response.body.mensagem).toBe(testAlerta.mensagem);
        });

        it('Deve retornar erro 404 se o alerta não for encontrado', async () => {
            const response = await request(app).get('/alertas/99999');
            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe("Alerta não encontrado");
        });
    });

    describe('PUT /alerts/:id', () => {
        it('Deve atualizar um alerta com sucesso e retornar status 200', async () => {
            const updatedData = { mensagem: "Mensagem do alerta foi atualizada!" };
            const response = await request(app)
                .put(`/alertas/${testAlerta.id_alerta}`)
                .send(updatedData);

            expect(response.statusCode).toBe(200);
            expect(response.body.mensagem).toBe(updatedData.mensagem);
        });

        it('Deve retornar erro 404 ao tentar atualizar um alerta que não existe', async () => {
            const updatedData = { mensagem: "Tentativa de atualizar fantasma" };
            const response = await request(app).put('/alertas/99999').send(updatedData);
            expect(response.statusCode).toBe(404);
        });
    });

    describe('DELETE /alerts/:id', () => {
        it('Deve deletar um alerta com sucesso e retornar status 204', async () => {
            const deleteResponse = await request(app).delete(`/alertas/${testAlerta.id_alerta}`);
            expect(deleteResponse.statusCode).toBe(204);

            // Tenta buscar o alerta deletado para confirmar que não existe mais
            const getResponse = await request(app).get(`/alertas/${testAlerta.id_alerta}`);
            expect(getResponse.statusCode).toBe(404);
        });

        it('Deve retornar erro 404 ao tentar deletar um alerta que não existe', async () => {
            const response = await request(app).delete('/alertas/99999');
            expect(response.statusCode).toBe(404);
        });
    });
});
