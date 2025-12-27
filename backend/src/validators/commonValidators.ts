import Joi from 'joi';

// Validação para IDs de usuário
export const userIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID deve ser um número',
      'number.integer': 'ID deve ser um número inteiro',
      'number.positive': 'ID deve ser positivo',
      'any.required': 'ID é obrigatório'
    })
});

// Validação para parâmetros de admin
export const adminUserBanSchema = Joi.object({
  ban: Joi.boolean()
    .required()
    .messages({
      'any.required': 'Status de ban é obrigatório'
    }),
  admin_notes: Joi.string()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Notas admin devem ter no máximo 500 caracteres'
    })
});

// Validação para query de busca admin
export const adminSearchQuerySchema = Joi.object({
  status: Joi.string()
    .valid('banned', 'active', 'inactive', 'admin')
    .optional()
    .messages({
      'any.only': 'Status deve ser: banned, active, inactive ou admin'
    }),
  search: Joi.string()
    .max(100)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Busca deve ter no máximo 100 caracteres'
    }),
  page: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(1)
    .messages({
      'number.min': 'Página deve ser pelo menos 1',
      'number.max': 'Página não pode ser maior que 1000'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': 'Limite deve ser pelo menos 1',
      'number.max': 'Limite não pode ser maior que 100'
    })
});

// Validação para parâmetros de interações
export const interactionSchema = Joi.object({
  to_user_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID do usuário alvo deve ser um número',
      'number.integer': 'ID do usuário alvo deve ser um número inteiro',
      'number.positive': 'ID do usuário alvo deve ser positivo',
      'any.required': 'ID do usuário alvo é obrigatório'
    }),
  action: Joi.string()
    .valid('like', 'pass')
    .required()
    .messages({
      'any.only': 'Ação deve ser: like ou pass',
      'any.required': 'Ação é obrigatória'
    })
});

// Validação para notificações
export const notificationIdSchema = Joi.object({
  notificationId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID da notificação deve ser um número',
      'number.integer': 'ID da notificação deve ser um número inteiro',
      'number.positive': 'ID da notificação deve ser positivo',
      'any.required': 'ID da notificação é obrigatório'
    })
});

// Validação para conversas
export const conversationIdSchema = Joi.object({
  conversationId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID da conversa deve ser um número',
      'number.integer': 'ID da conversa deve ser um número inteiro',
      'number.positive': 'ID da conversa deve ser positivo',
      'any.required': 'ID da conversa é obrigatório'
    })
});

export const targetUserIdSchema = Joi.object({
  targetUserId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID do usuário alvo deve ser um número',
      'number.integer': 'ID do usuário alvo deve ser um número inteiro',
      'number.positive': 'ID do usuário alvo deve ser positivo',
      'any.required': 'ID do usuário alvo é obrigatório'
    })
});

// Validação para query de recomendações
export const recommendationsQuerySchema = Joi.object({
  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .messages({
      'number.min': 'Limite deve ser pelo menos 1',
      'number.max': 'Limite não pode ser maior que 50'
    })
});

// Validação para relatórios
export const reportSchema = Joi.object({
  reported_user_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID do usuário reportado deve ser um número',
      'number.integer': 'ID do usuário reportado deve ser um número inteiro',
      'number.positive': 'ID do usuário reportado deve ser positivo',
      'any.required': 'ID do usuário reportado é obrigatório'
    }),
  reason: Joi.string()
    .valid('spam', 'harassment', 'inappropriate_content', 'fake_profile', 'other')
    .required()
    .messages({
      'any.only': 'Motivo deve ser: spam, harassment, inappropriate_content, fake_profile ou other',
      'any.required': 'Motivo é obrigatório'
    }),
  description: Joi.string()
    .max(1000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Descrição deve ter no máximo 1000 caracteres'
    })
});