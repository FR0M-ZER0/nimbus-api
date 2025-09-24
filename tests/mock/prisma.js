import { vi } from 'vitest';

// Mock profundo para simular a estrutura aninhada (prisma.parametro.create)
export const mockPrisma = {
  parametro: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

// Substitui a implementação real pela nossa mockada
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
}));