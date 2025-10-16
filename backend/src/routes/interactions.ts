import { Router } from 'express';
import { 
    likeUser, 
    getNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    getMatches, 
    getPendingLikes,
    unmatch
} from '../controllers/Interactions/interactionsController';
import auth from '../middlewares/auth';
import { interactionLimiter } from '../middlewares/rateLimiter';
import { validateRequest, validateParams } from '../middlewares/validation';
import { interactionSchema, notificationIdSchema, userIdSchema } from '../validators/commonValidators';

const router = Router();

// Curtir ou passar um usuário (com rate limiting e validação)
router.post('/interactions/like', interactionLimiter, auth, validateRequest(interactionSchema), likeUser);

// Buscar notificações do usuário
router.get('/notifications', auth, getNotifications);

// Marcar notificação como lida (com validação de parâmetro)
router.put('/notifications/:notificationId/read', auth, validateParams(notificationIdSchema), markNotificationAsRead);

// Marcar todas as notificações como lidas
router.put('/notifications/mark-all-read', auth, markAllNotificationsAsRead);

// Buscar matches do usuário
router.get('/matches', auth, getMatches);

// Buscar curtidas recebidas pendentes
router.get('/interactions/pending-likes', auth, getPendingLikes);

// Desfazer match (com validação de parâmetro)
router.delete('/matches/:matchId', auth, validateParams(userIdSchema), unmatch);

export default router;
