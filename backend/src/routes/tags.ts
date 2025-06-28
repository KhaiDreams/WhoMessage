import { Router } from 'express';
import { addTagsInterests, addTagsGames, getAllTagsInterests, getAllTagsGames } from '../controllers/Tags/tagsController';
import auth from '../middlewares/auth';

const router = Router();

// Adiciona tags de interesses ao usuário logado
router.post('/tags/interests', auth, addTagsInterests);

// Adiciona tags de jogos ao usuário logado
router.post('/tags/games', auth, addTagsGames);

// Lista todas as tags de interesses pré-prontas
router.get('/tags/interests', getAllTagsInterests);

// Lista todas as tags de jogos pré-prontas
router.get('/tags/games', getAllTagsGames);

export default router;
