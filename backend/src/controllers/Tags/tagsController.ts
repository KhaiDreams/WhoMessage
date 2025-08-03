import { TagsInterests } from '../../models/Tags/TagsInterests';
import { TagsGames } from '../../models/Tags/TagsGames';
import { User } from '../../models/Users/User';
import { Request, Response } from 'express';
import { PreTagsInterests } from '../../models/Tags/PreTagsInterests';
import { PreTagsGames } from '../../models/Tags/PreTagsGames';
import { Nicknames } from '../../models/Tags/Nicknames';

export const healthCheck = (req: Request, res: Response) => {
    res.json({'health-check': true});
};

export const addTagsInterests = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { pre_tag_ids } = req.body;
        if (!Array.isArray(pre_tag_ids) || pre_tag_ids.length < 3 || pre_tag_ids.length > 10) {
            return res.status(400).json({ error: 'Você deve selecionar de 3 a 10 interesses.' });
        }
        // Salva apenas os IDs
        const [tag, created] = await TagsInterests.findOrCreate({
            where: { user_id: userId },
            defaults: { pre_tag_ids }
        });
        if (!created) {
            tag.pre_tag_ids = pre_tag_ids;
            await tag.save();
        }
        res.status(201).json(tag);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add interests', details: err });
    }
};

export const addTagsGames = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { pre_tag_ids } = req.body;
        if (!Array.isArray(pre_tag_ids) || pre_tag_ids.length < 3 || pre_tag_ids.length > 20) {
            return res.status(400).json({ error: 'Você deve selecionar de 3 a 20 jogos' });
        }
        // Salva apenas os IDs
        const [tag, created] = await TagsGames.findOrCreate({
            where: { user_id: userId },
            defaults: { pre_tag_ids }
        });
        if (!created) {
            tag.pre_tag_ids = pre_tag_ids;
            await tag.save();
        }
        res.status(201).json(tag);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add games', details: err });
    }
};

export const getAllTagsInterests = async (req: Request, res: Response) => {
    try {
        const tags = await PreTagsInterests.findAll();
        res.json(tags);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch interests', details: err });
    }
};

export const getAllTagsGames = async (req: Request, res: Response) => {
    try {
        const tags = await PreTagsGames.findAll();
        res.json(tags);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch games', details: err });
    }
};

export const getUserTagsInterests = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const tag = await TagsInterests.findOne({ where: { user_id: userId } });
        res.json(tag || {});
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user interests', details: err });
    }
};

export const getUserTagsGames = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const tag = await TagsGames.findOne({ where: { user_id: userId } });
        res.json(tag || {});
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user games', details: err });
    }
};

export const addOrUpdateNicknames = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { psn, xbox, steam, epic_games, riot } = req.body;

        // Verifica se algum nickname já está em uso por outro usuário
        const whereClauses = [];
        if (psn) whereClauses.push({ psn });
        if (xbox) whereClauses.push({ xbox });
        if (steam) whereClauses.push({ steam });
        if (epic_games) whereClauses.push({ epic_games });
        if (riot) whereClauses.push({ riot });

        if (whereClauses.length > 0) {
            const Op = require('sequelize').Op;
            const conflicts = await Nicknames.findAll({
                where: {
                    [Op.or]: whereClauses,
                    user_id: { [Op.ne]: userId }
                }
            });
            if (conflicts && conflicts.length > 0) {
                // Identifica quais nicknames estão em conflito
                const conflictFields: string[] = [];
                for (const conflict of conflicts) {
                    if (psn && conflict.psn === psn) conflictFields.push('psn');
                    if (xbox && conflict.xbox === xbox) conflictFields.push('xbox');
                    if (steam && conflict.steam === steam) conflictFields.push('steam');
                    if (epic_games && conflict.epic_games === epic_games) conflictFields.push('epic_games');
                    if (riot && conflict.riot === riot) conflictFields.push('riot');
                }
                return res.status(409).json({ error: 'Nickname(s) já estão em uso por outro usuário.', conflicts: conflictFields });
            }
        }

        const [nickname, created] = await Nicknames.findOrCreate({
            where: { user_id: userId },
            defaults: { psn, xbox, steam, epic_games, riot }
        });
        if (!created) {
            nickname.psn = psn ?? nickname.psn;
            nickname.xbox = xbox ?? nickname.xbox;
            nickname.steam = steam ?? nickname.steam;
            nickname.epic_games = epic_games ?? nickname.epic_games;
            nickname.riot = riot ?? nickname.riot;
            await nickname.save();
        }
        res.status(201).json(nickname);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add/update nicknames', details: err });
    }
};

export const getUserNicknames = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const nickname = await Nicknames.findOne({ where: { user_id: userId } });
        res.json(nickname || {});
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user nicknames', details: err });
    }
};

// Recomendações usuários com mais tags em comum
export const getRecommendations = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);
        if (!userId || isNaN(userId)) {
            return res.status(401).json({ error: 'Usuário não autenticado ou ID inválido.' });
        }

        // Busca tags do usuário logado
        const userInterests = await TagsInterests.findOne({ where: { user_id: userId } });
        const userGames = await TagsGames.findOne({ where: { user_id: userId } });
        
        const userInterestIds = userInterests?.pre_tag_ids || [];
        const userGameIds = userGames?.pre_tag_ids || [];

        // Busca todos os outros usuários ativos (excluindo o próprio usuário)
        const { Op } = require('sequelize');
        
        // Busca usuários já interagidos para excluir das recomendações
        const { Like } = require('../../models/Interactions/Like');
        const { Match } = require('../../models/Interactions/Match');
        
        const [interactedLikes, existingMatches] = await Promise.all([
            Like.findAll({
                where: { from_user_id: userId },
                attributes: ['to_user_id']
            }),
            Match.findAll({
                where: {
                    [Op.or]: [
                        { user1_id: userId },
                        { user2_id: userId }
                    ]
                },
                attributes: ['user1_id', 'user2_id']
            })
        ]);

        // Lista de IDs para excluir (já interagidos ou com match)
        const excludeIds = new Set([userId]);
        interactedLikes.forEach((like: any) => excludeIds.add(like.to_user_id));
        existingMatches.forEach((match: any) => {
            excludeIds.add(match.user1_id);
            excludeIds.add(match.user2_id);
        });

        const allUsers = await User.findAll({ 
            where: { 
                id: { [Op.notIn]: Array.from(excludeIds) },
                active: true,
                ban: false
            },
            attributes: { exclude: ['email', 'password_hash'] }
        });

        if (!allUsers.length) {
            return res.json({ 
                message: 'Nenhum usuário encontrado no momento. Volte mais tarde!',
                recommendations: []
            });
        }

        // Busca tags de todos os usuários
        const userIds = allUsers.map(u => u.id);
        const allInterests = await TagsInterests.findAll({ where: { user_id: userIds } });
        const allGames = await TagsGames.findAll({ where: { user_id: userIds } });

        // Mapeia user_id => {interests, games}
        const userTagsMap: Record<number, { interests: number[]; games: number[] }> = {};
        
        // Inicializa todos os usuários
        allUsers.forEach(user => {
            userTagsMap[user.id] = { interests: [], games: [] };
        });

        // Preenche interesses
        allInterests.forEach(tag => {
            if (userTagsMap[tag.user_id]) {
                userTagsMap[tag.user_id].interests = tag.pre_tag_ids || [];
            }
        });

        // Preenche jogos
        allGames.forEach(tag => {
            if (userTagsMap[tag.user_id]) {
                userTagsMap[tag.user_id].games = tag.pre_tag_ids || [];
            }
        });

        // Busca nomes das tags para exibição
        const [preTagsGames, preTagsInterests] = await Promise.all([
            PreTagsGames.findAll(),
            PreTagsInterests.findAll()
        ]);

        const gameTagsMap = Object.fromEntries(preTagsGames.map(tag => [tag.id, tag.name]));
        const interestTagsMap = Object.fromEntries(preTagsInterests.map(tag => [tag.id, tag.name]));

        // Calcula similaridade para todos os usuários
        const recommendations = allUsers.map(otherUser => {
            const otherTags = userTagsMap[otherUser.id];
            
            // Encontra tags em comum
            const gamesCommon = userGameIds.filter(id => otherTags.games.includes(id));
            const interestsCommon = userInterestIds.filter(id => otherTags.interests.includes(id));
            
            // Sistema de pontuação: jogos valem mais que interesses
            const gameScore = gamesCommon.length * 3; // Peso maior para jogos
            const interestScore = interestsCommon.length * 2; // Peso menor para interesses
            const totalScore = gameScore + interestScore;

            // Categoria de compatibilidade
            let compatibility = 'low';
            if (gamesCommon.length >= 3) compatibility = 'perfect';
            else if (gamesCommon.length >= 1) compatibility = 'high';
            else if (interestsCommon.length >= 3) compatibility = 'good';
            else if (interestsCommon.length >= 1) compatibility = 'medium';

            return {
                user: otherUser,
                compatibility,
                totalScore,
                gameScore,
                interestScore,
                matches: {
                    games: {
                        count: gamesCommon.length,
                        common: gamesCommon.map(id => ({ id, name: gameTagsMap[id] })),
                        total: otherTags.games.length
                    },
                    interests: {
                        count: interestsCommon.length,
                        common: interestsCommon.map(id => ({ id, name: interestTagsMap[id] })),
                        total: otherTags.interests.length
                    }
                },
                percentage: Math.round(((gamesCommon.length + interestsCommon.length) / Math.max(userGameIds.length + userInterestIds.length, 1)) * 100)
            };
        });

        // Ordena por compatibilidade (jogos primeiro, depois interesses, depois score total)
        recommendations.sort((a, b) => {
            // Prioridade 1: Mais jogos em comum
            if (a.matches.games.count !== b.matches.games.count) {
                return b.matches.games.count - a.matches.games.count;
            }
            // Prioridade 2: Mais interesses em comum
            if (a.matches.interests.count !== b.matches.interests.count) {
                return b.matches.interests.count - a.matches.interests.count;
            }
            // Prioridade 3: Score total
            return b.totalScore - a.totalScore;
        });

        // Separa por categorias
        const perfectMatches = recommendations.filter(r => r.compatibility === 'perfect');
        const highMatches = recommendations.filter(r => r.compatibility === 'high');
        const goodMatches = recommendations.filter(r => r.compatibility === 'good');
        const mediumMatches = recommendations.filter(r => r.compatibility === 'medium');
        const lowMatches = recommendations.filter(r => r.compatibility === 'low');

        // Limita resultados (máx 20 pessoas)
        const finalRecommendations = [
            ...perfectMatches.slice(0, 5),
            ...highMatches.slice(0, 5),
            ...goodMatches.slice(0, 4),
            ...mediumMatches.slice(0, 3),
            ...lowMatches.slice(0, 3)
        ];

        res.json({
            message: `Encontramos ${finalRecommendations.length} pessoas para você!`,
            stats: {
                perfect: perfectMatches.length,
                high: highMatches.length,
                good: goodMatches.length,
                medium: mediumMatches.length,
                low: lowMatches.length
            },
            userProfile: {
                games: userGameIds.length,
                interests: userInterestIds.length
            },
            recommendations: finalRecommendations
        });
    } catch (err) {
        console.error('Recommendation error:', err);
        res.status(500).json({ error: 'Failed to fetch recommendations', details: err });
    }
};

// Busca jogos de um usuário específico por ID
export const getUserGamesByUserId = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const userIdNum = parseInt(userId);
        
        if (!userIdNum || isNaN(userIdNum)) {
            return res.status(400).json({ error: 'ID de usuário inválido' });
        }

        // Verifica se o usuário existe
        const user = await User.findByPk(userIdNum);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const userGames = await TagsGames.findOne({ where: { user_id: userIdNum } });
        if (!userGames || !userGames.pre_tag_ids || userGames.pre_tag_ids.length === 0) {
            return res.json({ pre_tag_ids: [] });
        }

        // Busca os nomes dos jogos
        const gameDetails = await PreTagsGames.findAll({
            where: { id: userGames.pre_tag_ids }
        });

        res.json({
            pre_tag_ids: userGames.pre_tag_ids,
            games: gameDetails
        });
    } catch (err) {
        console.error('Error fetching user games:', err);
        res.status(500).json({ error: 'Failed to fetch user games', details: err });
    }
};

// Busca interesses de um usuário específico por ID
export const getUserInterestsByUserId = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const userIdNum = parseInt(userId);
        
        if (!userIdNum || isNaN(userIdNum)) {
            return res.status(400).json({ error: 'ID de usuário inválido' });
        }

        // Verifica se o usuário existe
        const user = await User.findByPk(userIdNum);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const userInterests = await TagsInterests.findOne({ where: { user_id: userIdNum } });
        if (!userInterests || !userInterests.pre_tag_ids || userInterests.pre_tag_ids.length === 0) {
            return res.json({ pre_tag_ids: [] });
        }

        // Busca os nomes dos interesses
        const interestDetails = await PreTagsInterests.findAll({
            where: { id: userInterests.pre_tag_ids }
        });

        res.json({
            pre_tag_ids: userInterests.pre_tag_ids,
            interests: interestDetails
        });
    } catch (err) {
        console.error('Error fetching user interests:', err);
        res.status(500).json({ error: 'Failed to fetch user interests', details: err });
    }
};