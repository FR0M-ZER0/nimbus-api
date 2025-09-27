// src/dto/userDTO.js
import { z } from 'zod';

// Schema para validação do corpo (body) na criação
const createSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter entre 2 e 255 caracteres')
    .max(255, 'Nome deve ter entre 2 e 255 caracteres'),
  email: z.string()
    .email('Email válido é obrigatório'),
  senha: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres'),
  id_nivel_acesso: z.number()
    .int('Nível de acesso é obrigatório')
});

// Schema para validação do corpo (body) na atualização
const updateSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter entre 2 e 255 caracteres')
    .max(255, 'Nome deve ter entre 2 e 255 caracteres')
    .optional(),
  email: z.string()
    .email('Email válido é obrigatório')
    .optional(),
  id_nivel_acesso: z.number()
    .int('Nível de acesso deve ser um número inteiro')
    .optional()
});

// Schema para validação de parâmetros (ex: /:id)
const idParamSchema = z.object({
  id: z.coerce.number().int('ID do usuário deve ser um número inteiro')
});

// Exporte os schemas
export const usuarioValidationSchemas = {
  create: createSchema,
  update: updateSchema,
  getById: idParamSchema,
  delete: idParamSchema
};

// DTOs (opcional - você pode usar diretamente os schemas do Zod)
class CreateUsuarioDto {
  constructor(data) {
    this.nome = data.nome;
    this.email = data.email;
    this.senha = data.senha;
    this.id_nivel_acesso = data.id_nivel_acesso;
  }
}

class UpdateUsuarioDto {
  constructor(data) {
    this.nome = data.nome;
    this.email = data.email;
    this.id_nivel_acesso = data.id_nivel_acesso;
  }
}

export { CreateUsuarioDto, UpdateUsuarioDto };