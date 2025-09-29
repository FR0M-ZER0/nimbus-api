import { z } from "zod";

export const createTipoAlertaDTO = z.object({
  operador: z.string({ required_error: "O operador é obrigatório." })
    .max(10, "O operador deve ter no máximo 10 caracteres."),
  valor: z.number({ required_error: "O valor é obrigatório." })
    .positive("O valor deve ser positivo."),
});

export const updateTipoAlertaDTO = z.object({
  operador: z.string().max(10).optional(),
  valor: z.number().positive().optional(),
});
