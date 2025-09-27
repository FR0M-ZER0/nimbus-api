// dto/tipoParametroDTO.js
import { z } from "zod";

export const createTipoParametroDTO = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  unidade: z.string().min(1, "Unidade é obrigatória"),
  fator: z.number().optional(),
  polinomio: z.string().optional(),
  offset: z.number().optional(),
  json: z.any(), // Pode ajustar conforme o formato esperado
});

export const updateTipoParametroDTO = z.object({
  nome: z.string().min(1).optional(),
  unidade: z.string().min(1).optional(),
  fator: z.number().optional(),
  polinomio: z.string().optional(),
  offset: z.number().optional(),
  json: z.any().optional(),
});
