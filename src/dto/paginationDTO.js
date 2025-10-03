import { z } from 'zod';

export const paginationQueryDTO = z.object({
  
  page: z.coerce.number({
    invalid_type_error: 'O parâmetro "page" deve ser um número.',
  }).int().positive().default(1),

  limit: z.coerce.number({
    invalid_type_error: 'O parâmetro "limit" deve ser um número.',
  }).int().positive().default(10),

  sortBy: z.enum(['data_criacao', 'id_estacao', 'nome'])
    .default('data_criacao'),
  
  sortOrder: z.enum(['asc', 'desc'])
    .default('desc'),
});