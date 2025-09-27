import { z } from 'zod';

// Schema for creating a user
export const createUsuarioSchema = z.object({
  body: z.object({
    nome: z.string().min(2, 'Nome deve ter entre 2 e 255 caracteres').max(255),
    email: z.string().email('Email válido é obrigatório'),
    senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    id_nivel_acesso: z.number().int()
  })
});

// Schema for updating a user
export const updateUsuarioSchema = z.object({
  params: z.object({
    id: z.string().transform(val => parseInt(val)).refine(num => !isNaN(num), 'ID deve ser um número')
  }),
  body: z.object({
    nome: z.string().min(2).max(255).optional(),
    email: z.string().email().optional(),
    id_nivel_acesso: z.number().int().optional()
  }).partial()
});

// Schema for getting/deleting by ID
export const idParamSchema = z.object({
  params: z.object({
    id: z.string().transform(val => parseInt(val)).refine(num => !isNaN(num), 'ID deve ser um número')
  })
});

export const validate = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      params: req.params,
      query: req.query
    });
    return next();
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        errors: error.issues.map(issue => ({
          location: issue.path.join('.'),
          msg: issue.message,
          value: issue.input
        }))
      });
    }
    return res.status(500).json({ error: 'Erro interno de validação' });
  }
};