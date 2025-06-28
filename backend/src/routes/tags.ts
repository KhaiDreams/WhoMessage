import { Router } from 'express';
import { addTagsInterests, addTagsGames, getAllTagsInterests, getAllTagsGames, getUserTagsInterests, getUserTagsGames, addOrUpdateNicknames, getUserNicknames } from '../controllers/Tags/tagsController';
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

// Busca as tags de interesses do usuário logado
router.get('/tags/interests-user', auth, getUserTagsInterests);

// Busca as tags de jogos do usuário logado
router.get('/tags/games-user', auth, getUserTagsGames);

// Adiciona ou atualiza nicknames do usuário logado
router.post('/tags/nicknames', auth, addOrUpdateNicknames);

// Busca os nicknames do usuário logado
router.get('/tags/nicknames-user', auth, getUserNicknames);

export default router;
