import request from 'supertest';
import app from '../src/index.js';
import * as prismaModule from '../src/generated/prisma/index.js';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../src/generated/prisma/index.js', () => {
  const mPrismaClient = {
    parametro: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => mPrismaClient) };
});

describe('Parameter Controller', () => {
  const prisma = new prismaModule.PrismaClient();

  const sampleParameter = {
    id_parametro: 1,
    id_estacao: 1,
    id_tipo_parametro: 1,
    descricao: 'Teste',
    json: { key: 'value' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // CREATE
  it('should create a parameter successfully', async () => {
    prisma.parametro.create.mockResolvedValue(sampleParameter);

    const res = await request(app).post('/api/parameters').send(sampleParameter);

    expect(res.status).toBe(201);
    expect(res.body).toEqual(sampleParameter);
    expect(prisma.parametro.create).toHaveBeenCalledWith({
      data: sampleParameter,
    });
  });



  // READ ALL
  it('should list all parameters', async () => {
    prisma.parametro.findMany.mockResolvedValue([sampleParameter]);

    const res = await request(app).get('/api/parameters');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([sampleParameter]);
  });

  // READ BY ID
  it('should get parameter by id', async () => {
    prisma.parametro.findUnique.mockResolvedValue(sampleParameter);

    const res = await request(app).get('/api/parameters/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(sampleParameter);
  });

  it('should return 404 if parameter not found', async () => {
    prisma.parametro.findUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/parameters/999');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Parâmetro não encontrado');
  });

  // UPDATE
  it('should update a parameter', async () => {
    const updatedParameter = { ...sampleParameter, descricao: 'Atualizado' };
    prisma.parametro.update.mockResolvedValue(updatedParameter);

    const res = await request(app)
      .put('/api/parameters/1')
      .send({ descricao: 'Atualizado' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedParameter);
  });

  it('should return 404 if parameter to update not found', async () => {
    prisma.parametro.update.mockRejectedValue({ code: 'P2025' });

    const res = await request(app)
      .put('/api/parameters/999')
      .send({ descricao: 'Atualizado' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Parâmetro não encontrado');
  });

  // DELETE
  it('should delete a parameter', async () => {
    prisma.parametro.delete.mockResolvedValue(sampleParameter);

    const res = await request(app).delete('/api/parameters/1');

    expect(res.status).toBe(204);
  });

  it('should return 404 if parameter to delete not found', async () => {
    prisma.parametro.delete.mockRejectedValue({ code: 'P2025' });

    const res = await request(app).delete('/api/parameters/999');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Parâmetro não encontrado');
  });
});
