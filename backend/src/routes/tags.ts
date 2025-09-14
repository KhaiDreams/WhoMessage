import { Router } from 'express';
import { addTagsInterests, addTagsGames, getAllTagsInterests, getAllTagsGames, getUserTagsInterests, getUserTagsGames, addOrUpdateNicknames, getUserNicknames, getRecommendations, getUserGamesByUserId, getUserInterestsByUserId } from '../controllers/Tags/tagsController';
import auth from '../middlewares/auth';

const router = Router();

// Adiciona tags de interesses ao usuário logado (agora por IDs)
router.post('/tags/interests', auth, addTagsInterests);

// Adiciona tags de jogos ao usuário logado (agora por IDs)
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

// Recomendação: usuários com mais tags em comum
router.get('/tags/recommendations', auth, getRecommendations);

// Busca jogos de um usuário específico por ID
router.get('/tags/games-user/:userId', auth, getUserGamesByUserId);

// Busca interesses de um usuário específico por ID
router.get('/tags/interests-user/:userId', auth, getUserInterestsByUserId);

export default router;
