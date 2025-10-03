import { z } from "zod";

export const createAlertaDTO = z.object({
  id_estacao: z.string({ required_error: "O id_estacao é obrigatório." }),
  titulo: z.string({ required_error: "O título é obrigatório." }).nonempty(),
  texto: z.string({ required_error: "O texto é obrigatório." }).nonempty(),
  id_tipo_alerta: z.number().int().positive().optional(),
  id_medida: z.number().int().positive().optional(),
  id_tipo_parametro: z.number().int().positive().optional(),

  usuarios: z.array(z.number().int().positive()).optional(),
});

export const updateAlertaDTO = z.object({
  titulo: z.string().nonempty().optional(),
  texto: z.string().nonempty().optional(),
  id_tipo_alerta: z.number().int().positive().optional(),
  id_parametro: z.number().int().positive().optional(),
  usuarios: z.array(z.number().int().positive()).optional(),
});