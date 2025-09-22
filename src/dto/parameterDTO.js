import { z } from "zod";

export const createParameterDTO = z.object({
  id_parametro: z
    .number({
      required_error: "O id do parâmetro é obrigatório",
    })
    .int()
    .positive("O id do parâmetro deve ser um número inteiro positivo"),

  id_estacao: z
    .number({
      required_error: "O id da estação é obrigatório",
    })
    .int()
    .positive("O id da estação deve ser um número inteiro positivo"),

  id_tipo_parametro: z
    .number({
      required_error: "O id do tipo de parâmetro é obrigatório",
    })
    .int()
    .positive("O id do tipo de parâmetro deve ser um número inteiro positivo"),

  descricao: z.string().optional(),
  json: z.record(z.any(), {
    required_error: "O campo json é obrigatório",
  }),
});

export const updateParameterDTO = z.object({
  id_tipo_parametro: z.number().int().positive().optional(),
  json: z.record(z.any()).optional(),
  descricao: z.string().optional(),
});
