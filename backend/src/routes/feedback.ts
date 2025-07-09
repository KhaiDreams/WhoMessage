import { Router } from 'express';
import { createFeedback, listFeedbacks } from '../controllers/Feedback/feedbackController';
import auth from '../middlewares/auth';

const router = Router();

// Usuário logado pode enviar feedback
// Apenas admin pode listar feedbacks
router.get('/', auth, listFeedbacks);
router.post('/', auth, createFeedback);

export default router;
