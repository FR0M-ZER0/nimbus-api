import { z } from "zod";

// DTO para a criação de um novo alerta, alinhado com o esquema Prisma.
export const createAlertaDTO = z.object({
  // id_tipo_alerta deve ser um número inteiro positivo.
  id_tipo_alerta: z.number({
    required_error: "O id_tipo_alerta é obrigatório.",
    invalid_type_error: "O id_tipo_alerta deve ser um número.",
  }).int().positive("O id_tipo_alerta deve ser um número positivo."),

  // id_usuario deve ser um número inteiro positivo.
  id_usuario: z.number({
    required_error: "O id_usuario é obrigatório.",
    invalid_type_error: "O id_usuario deve ser um número.",
  }).int().positive("O id_usuario deve ser um número positivo."),

  // A mensagem do alerta.
  mensagem: z.string({
    required_error: "A mensagem é obrigatória.",
  }).nonempty("A mensagem não pode estar vazia."),
});

// DTO para a atualização de um alerta. Todos os campos são opcionais.
// Permite a modificação da mensagem ou a reatribuição do alerta para outro tipo ou usuário.
export const updateAlertaDTO = z.object({
  id_tipo_alerta: z.number().int().positive("O id_tipo_alerta deve ser um número positivo.").optional(),
  id_usuario: z.number().int().positive("O id_usuario deve ser um número positivo.").optional(),
  mensagem: z.string().nonempty("A mensagem não pode estar vazia.").optional(),
});
