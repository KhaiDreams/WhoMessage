import express from 'express';
import { ChatController } from '../controllers/Chat/chatController';
import { chatAuthMiddleware } from '../middlewares/chatAuth';
import { messageLimiter } from '../middlewares/rateLimiter';
import { validateParams } from '../middlewares/validation';
import { conversationIdSchema, targetUserIdSchema } from '../validators/commonValidators';

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(chatAuthMiddleware);

// Rotas para conversas (com validação de parâmetros)
router.get('/conversations', ChatController.getConversations);
router.get('/conversations/unread-count', ChatController.getUnreadCount);
router.get('/conversations/:targetUserId', validateParams(targetUserIdSchema), ChatController.getOrCreateConversation);

// Rotas para mensagens (com validação e rate limiting)
router.get('/conversations/:conversationId/messages', validateParams(conversationIdSchema), ChatController.getMessages);
router.put('/conversations/:conversationId/read', messageLimiter, validateParams(conversationIdSchema), ChatController.markMessagesAsRead);

export default router;