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

const router = Router();

// Curtir ou passar um usuário
router.post('/interactions/like', auth, likeUser);

// Buscar notificações do usuário
router.get('/notifications', auth, getNotifications);

// Marcar notificação como lida
router.put('/notifications/:notificationId/read', auth, markNotificationAsRead);

// Marcar todas as notificações como lidas
router.put('/notifications/mark-all-read', auth, markAllNotificationsAsRead);

// Buscar matches do usuário
router.get('/matches', auth, getMatches);

// Buscar curtidas recebidas pendentes
router.get('/interactions/pending-likes', auth, getPendingLikes);

// Desfazer match
router.delete('/matches/:matchId', auth, unmatch);

export default router;
