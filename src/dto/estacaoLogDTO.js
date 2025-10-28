import { z } from "zod";

export const createEstacaoLogDTO = z.object({
  id_estacao: z.string({ required_error: "O id_estacao é obrigatório." }),
  data_sent: z
    .number({ required_error: "O campo data_sent é obrigatório." })
    .int()
    .positive({ message: "O campo data_sent deve ser um número inteiro não negativo (KB)." }),
});

export const estacaoLogResponseDTO = z.object({
  id_log: z.number().int(),
  id_estacao: z.string(),
  data_sent: z.number().int().positive(),
  created_at: z.string(),
});
