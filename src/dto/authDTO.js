import { z } from "zod";

export const loginDTO = z.object({
  email: z.string({ required_error: "O email é obrigatório." }).email("Email inválido."),
  senha: z.string({ required_error: "A senha é obrigatória." }).min(6, "A senha deve ter no mínimo 6 caracteres."),
});
