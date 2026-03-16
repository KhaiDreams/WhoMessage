import rateLimit from 'express-rate-limit';

// Rate limiting para login (conta apenas tentativas mal sucedidas)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 tentativas falhas por IP
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para registro
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // máximo 5 registros por IP/hora
  message: { error: 'Muitos cadastros em pouco tempo. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para mudança de senha
export const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 tentativas de mudança de senha por IP
  message: { error: 'Muitas tentativas de mudança de senha. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting geral para APIs
export const generalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 500, // máximo 500 requisições por IP
  message: { error: 'Muitas requisições. Tente novamente em 5 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para interações (likes/passes)
export const interactionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // máximo 30 interações por minuto por IP
  message: { error: 'Muitas interações. Aguarde um momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para mensagens
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // máximo 30 mensagens por minuto por IP
  message: { error: 'Muitas mensagens. Aguarde um momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para relatórios
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 30, // máximo 30 relatórios por hora por IP
  message: { error: 'Muitos relatórios enviados. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para buscas e recomendações
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 35, // máximo 35 buscas por minuto por IP
  message: { error: 'Muitas buscas. Aguarde um momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});
