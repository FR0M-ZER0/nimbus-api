import { z } from 'zod';
import { en, id } from 'zod/locales';

export const createStationDTO = z.object({
    id_estacao: z.number({
        required_error: 'O id da estação é obrigatório',
    }).int().positive("O id da estação deve ser um número inteiro positivo"),

    nome: z.string({
        required_error: 'O nome da estação é obrigatório',
    }).min(3, 'O nome da estação deve ter no mínimo 3 caracteres'),

    endereco: z.string({}).optional(),

    latitude: z.number({
        required_error: 'A latitude da estação é obrigatória',
    }).min(-90).max(90, 'A latitude deve estar entre -90 e 90'),
    
    longitude: z.number({
        required_error: 'A longitude da estação é obrigatória',
    }).min(-180).max(180, 'A longitude deve estar entre -180 e 180'),

    descricao: z.string().optional(),

    id_usuario: z.number({
        required_error: 'O id do usuário é obrigatório',
    }).int().positive("O id do usuário deve ser um número inteiro positivo"),
});

export const updateStationDTO = z.object({
    nome: z.string().min(3).optional(),
    endereco: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    descricao: z.string().optional(),
    id_usuario: z.number().int().positive().optional(),
})