import { z } from 'zod';

export const alertPaginationQueryDTO = z.object({
  page: z.coerce.number({
    invalid_type_error: 'O parâmetro "page" deve ser um número.',
  }).int().positive().default(1),

  limit: z.coerce.number({
    invalid_type_error: 'O parâmetro "limit" deve ser um número.',
  }).int().positive().default(10),

  sortBy: z.enum(['data_hora', 'titulo', 'usuario_created_at'])
    .default('data_hora'),
  
  sortOrder: z.enum(['asc', 'desc'])
    .default('desc'),
  
  search: z.string().optional().default(''),
  
  tipoParametroNome: z.string().optional(),
  tipoAlertaValor: z.coerce.number().optional(),
});