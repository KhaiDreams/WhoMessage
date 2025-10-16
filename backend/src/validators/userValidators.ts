import Joi from 'joi';

// Schema para registro de usuário
export const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'O username deve conter apenas letras e números',
      'string.min': 'O username deve ter pelo menos 3 caracteres',
      'string.max': 'O username deve ter no máximo 30 caracteres',
      'any.required': 'Username é obrigatório'
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email deve ter um formato válido',
      'any.required': 'Email é obrigatório'
    }),
  
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\|,.<>\\/?]).{8,}$'))
    .required()
    .messages({
      'string.min': 'A senha deve ter pelo menos 8 caracteres',
      'string.pattern.base': 'A senha deve conter pelo menos 1 letra maiúscula, 1 número e 1 caractere especial',
      'any.required': 'Senha é obrigatória'
    }),
  
  age: Joi.number()
    .integer()
    .min(14)
    .max(99)
    .required()
    .messages({
      'number.min': 'Você precisa ter a idade mínima de 14 anos',
      'number.max': 'Idade máxima permitida é 99 anos',
      'any.required': 'Idade é obrigatória'
    }),
  
  bio: Joi.string()
    .max(300)
    .allow('')
    .optional()
    .messages({
      'string.max': 'A descrição (bio) não pode ter mais que 300 caracteres'
    }),
  
  pfp: Joi.string().uri().allow('').optional(),
  
  nicknames: Joi.array().items(Joi.string().trim()).optional(),
  active: Joi.boolean().optional(),
  is_admin: Joi.boolean().optional(),
  ban: Joi.boolean().optional()
});

// Schema para login
export const loginSchema = Joi.object({
  login: Joi.string()
    .required()
    .messages({
      'any.required': 'Email/username é obrigatório'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Senha é obrigatória'
    })
});

// Schema para mudança de senha
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Senha atual é obrigatória'
    }),
  
  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\|,.<>\\/?]).{8,}$'))
    .required()
    .messages({
      'string.min': 'A nova senha deve ter pelo menos 8 caracteres',
      'string.pattern.base': 'A nova senha deve conter pelo menos 1 letra maiúscula, 1 número e 1 caractere especial',
      'any.required': 'Nova senha é obrigatória'
    })
});

// Schema para atualização de usuário
export const updateUserSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .optional()
    .messages({
      'string.alphanum': 'O username deve conter apenas letras e números',
      'string.min': 'O username deve ter pelo menos 3 caracteres',
      'string.max': 'O username deve ter no máximo 30 caracteres'
    }),
  
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Email deve ter um formato válido'
    }),
  
  age: Joi.number()
    .integer()
    .min(14)
    .max(99)
    .optional()
    .messages({
      'number.min': 'Você precisa ter a idade mínima de 14 anos',
      'number.max': 'Idade máxima permitida é 99 anos'
    }),
  
  bio: Joi.string()
    .max(300)
    .allow('')
    .optional()
    .messages({
      'string.max': 'A descrição (bio) não pode ter mais que 300 caracteres'
    }),
  
  pfp: Joi.string().uri().allow('').optional(),
  
  nicknames: Joi.array().items(
    Joi.string()
      .trim()
      .min(1)
      .max(50)
      .pattern(/^[a-zA-Z0-9_\-\s]+$/)
      .messages({
        'string.min': 'Nickname não pode estar vazio',
        'string.max': 'Nickname deve ter no máximo 50 caracteres',
        'string.pattern.base': 'Nickname pode conter apenas letras, números, _ e -'
      })
  ).optional()
});

// Schema para adicionar nicknames
export const addNicknamesSchema = Joi.object({
  nicknames: Joi.alternatives()
    .try(
      Joi.string()
        .trim()
        .min(1)
        .max(50)
        .pattern(/^[a-zA-Z0-9_\-\s]+$/),
      Joi.array().items(
        Joi.string()
          .trim()
          .min(1)
          .max(50)
          .pattern(/^[a-zA-Z0-9_\-\s]+$/)
      ).min(1)
    )
    .required()
    .messages({
      'alternatives.types': 'Nicknames devem ser uma string ou array de strings',
      'string.min': 'Nickname não pode estar vazio',
      'string.max': 'Nickname deve ter no máximo 50 caracteres',
      'string.pattern.base': 'Nickname pode conter apenas letras, números, _ e -',
      'array.min': 'Pelo menos um nickname é obrigatório',
      'any.required': 'Nicknames são obrigatórios'
    })
});