import { z } from 'zod';

export const reportQueryDTO = z.object({
  startDate: z.coerce.date({
    invalid_type_error: 'Data de início inválida',
    required_error: 'Data de início é obrigatória',
  }),
  endDate: z.coerce.date({
    invalid_type_error: 'Data de fim inválida',
    required_error: 'Data de fim é obrigatória',
  }),
  
  id_estacao: z.string({
    required_error: "É necessário selecionar uma estação para gerar o relatório.",
  }), 
  
  id_parametro: z.coerce.number().int().positive().optional(),
  
}).refine((data) => data.endDate >= data.startDate, {
  message: "A data final deve ser maior ou igual à data inicial",
  path: ["endDate"],
});