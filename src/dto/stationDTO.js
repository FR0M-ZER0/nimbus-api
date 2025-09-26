import { z } from 'zod';
import { en, id } from 'zod/locales';

export const createStationDTO = z.object({
    id_estacao: z.number({
        required_error: 'O id_estacao é obrigatório.',
    }).int().positive("O id_estacao deve ser um número inteiro positivo."),

    nome: z.string({
        required_error: 'O nome da estação é obrigatório.',
    }).min(3, { message: 'O nome da estação deve ter no mínimo 3 caracteres.' }), // <-- Mensagem com ponto final

    endereco: z.string().optional(),

    latitude: z.number({
        required_error: 'A latitude é obrigatória.',
    })
    .min(-90, { message: 'A latitude deve ser no mínimo -90.' }) // <-- Mensagem customizada para .min
    .max(90, { message: 'A latitude deve ser no máximo 90.' }),
    
    longitude: z.number({
        required_error: 'A longitude é obrigatória.',
    })
    .min(-180, { message: 'A longitude deve ser no mínimo -180.' })
    .max(180, { message: 'A longitude deve ser no máximo 180.' }),

    descricao: z.string().optional(),

    id_usuario: z.number({
        required_error: 'O id_usuario é obrigatório.',
    }).int().positive("O id_usuario deve ser um número inteiro positivo."),
});

export const updateStationDTO = z.object({
    nome: z.string().min(3).optional(),
    endereco: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    descricao: z.string().optional(),
    id_usuario: z.number().int().positive().optional(),
})