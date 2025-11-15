import { z } from "zod";

export const createMedidaDTO = z.object({
  id_parametro: z
    .number({
      required_error: "O id_parametro é obrigatório.",
      invalid_type_error: "O id_parametro deve ser um número.",
    })
    .int()
    .positive(),
  valor: z
    .number({
      required_error: "O valor é obrigatório.",
      invalid_type_error: "O valor deve ser numérico.",
    }),
  data_hora: z
    .number({
      required_error: "A data_hora é obrigatória.",
      invalid_type_error: "Formato inválido. Utilize a data em Unixtime.",
    })
    .int(),
});

const formatUnixToBR = (unixTime) => {
  const date = new Date(unixTime * 1000);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
};

export const medidaResponseDTO = z.object({
  id_medida: z.number().int(),
  id_parametro: z.number().int(),
  valor: z
    .any()
    .transform(v =>
      typeof v === "object" && v !== null && "toString" in v
        ? parseFloat(v.toString())
        : Number(v)
    )
    .refine(v => !isNaN(v), { message: "Valor inválido" }),
  data_hora: z.number().transform(formatUnixToBR),
});