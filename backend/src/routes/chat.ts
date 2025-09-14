import express from 'express';
import { ChatController } from '../controllers/Chat/chatController';
import { chatAuthMiddleware } from '../middlewares/chatAuth';

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(chatAuthMiddleware);

// Rotas para conversas
router.get('/conversations', ChatController.getConversations);
router.get('/conversations/unread-count', ChatController.getUnreadCount);
router.get('/conversations/:targetUserId', ChatController.getOrCreateConversation);

// Rotas para mensagens
router.get('/conversations/:conversationId/messages', ChatController.getMessages);
router.put('/conversations/:conversationId/read', ChatController.markMessagesAsRead);

export default router;