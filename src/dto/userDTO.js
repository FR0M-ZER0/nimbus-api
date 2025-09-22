const { body, param, query } = require('express-validator');

const usuarioValidationRules = {
  create: [
    body('nome')
      .notEmpty()
      .withMessage('Nome é obrigatório')
      .isLength({ min: 2, max: 255 })
      .withMessage('Nome deve ter entre 2 e 255 caracteres'),
    body('email')
      .isEmail()
      .withMessage('Email válido é obrigatório')
      .normalizeEmail(),
    body('senha')
      .isLength({ min: 6 })
      .withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('id_nivel_acesso')
      .isInt()
      .withMessage('Nível de acesso é obrigatório')
  ],

  update: [
    param('id')
      .isInt()
      .withMessage('ID do usuário deve ser um número inteiro'),
    body('nome')
      .optional()
      .isLength({ min: 2, max: 255 })
      .withMessage('Nome deve ter entre 2 e 255 caracteres'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Email válido é obrigatório')
      .normalizeEmail(),
    body('id_nivel_acesso')
      .optional()
      .isInt()
      .withMessage('Nível de acesso deve ser um número inteiro')
  ],

  getById: [
    param('id')
      .isInt()
      .withMessage('ID do usuário deve ser um número inteiro')
  ],

  delete: [
    param('id')
      .isInt()
      .withMessage('ID do usuário deve ser um número inteiro')
  ]
};

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

module.exports = {
  usuarioValidationRules,
  CreateUsuarioDto,
  UpdateUsuarioDto
};