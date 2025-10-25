import { z } from 'zod';

export const alarmPaginationQueryDTO = z.object({
  page: z.coerce.number({
    invalid_type_error: 'O parâmetro "page" deve ser um número.',
  }).int().positive().default(1),

  limit: z.coerce.number({
    invalid_type_error: 'O parâmetro "limit" deve ser um número.',
  }).int().positive().default(10),

  sortBy: z.enum(['created_at', 'valor'])
    .default('created_at'),
  
  sortOrder: z.enum(['asc', 'desc'])
    .default('desc'),
  
  // Filter by alert ID
  id_alerta: z.coerce.number().int().positive().optional(),
  
  // Search parameters for Medida's valor
  valorMin: z.coerce.number().optional(),
  valorMax: z.coerce.number().optional(),
  valorSearch: z.coerce.number().optional(),
});