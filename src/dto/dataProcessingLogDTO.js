import { z } from "zod";

export const createDataProcessingLogDTO = z.object({});

export const dataProcessingLogResponseDTO = z.object({
  id_log: z.number().int(),
  created_at: z.string(),
});
