import { z } from "zod";

export const createEstacaoStatusDTO = z.object({
  id_estacao: z.string({ required_error: "O id_estacao é obrigatório." }),
  status: z.enum(["ONLINE", "OFFLINE"], {
    required_error: "O status é obrigatório.",
    invalid_type_error: "Status inválido. Deve ser ONLINE, OFFLINE",
  }),
});

export const estacaoStatusResponseDTO = z.object({
  id_status: z.number().int(),
  id_estacao: z.string(),
  status: z.enum(["ONLINE", "OFFLINE"]),
  created_at: z.string(),
});
