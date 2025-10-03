import { z } from "zod";

export const createAlarmeDTO = z.object({
  id_usuario: z.number({ required_error: "O id_usuario é obrigatório." }).int().positive(),
  id_medida: z.number({ required_error: "O id_medida é obrigatório." }).int().positive(),
  id_alerta: z.number({ required_error: "O id_alerta é obrigatório." }).int().positive(),
});
