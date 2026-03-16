import { TagsInterests } from '../../models/Tags/TagsInterests';
import { TagsGames } from '../../models/Tags/TagsGames';
import { User } from '../../models/Users/User';
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { PreTagsInterests } from '../../models/Tags/PreTagsInterests';
import { PreTagsGames } from '../../models/Tags/PreTagsGames';
import { Nicknames } from '../../models/Tags/Nicknames';
import { Like } from '../../models/Interactions/Like';
import { Match } from '../../models/Interactions/Match';

const TAG_CACHE_TTL_MS = 10 * 60 * 1000;
let tagsCache: {
    expiresAt: number;
    gameTagsMap: Record<number, string>;
    interestTagsMap: Record<number, string>;
} | null = null;

const RECOMMENDATIONS_CACHE_TTL_MS = Number(process.env.RECOMMENDATIONS_CACHE_TTL_MS || 20_000);
const RECOMMENDATIONS_CANDIDATE_WINDOW = Math.max(
    Number(process.env.RECOMMENDATIONS_CANDIDATE_WINDOW || 400),
    120
);

type RecommendationEntry = {
    user: any;
    compatibility: 'perfect' | 'high' | 'good' | 'medium' | 'low';
    totalScore: number;
    gameScore: number;
    interestScore: number;
    matches: {
        games: {
            count: number;
            common: Array<{ id: number; name: string }>;
            total: number;
        };
        interests: {
            count: number;
            common: Array<{ id: number; name: string }>;
            total: number;
        };
    };
    percentage: number;
};

type RecommendationPayload = {
    message: string;
    stats: {
        perfect: number;
        high: number;
        good: number;
        medium: number;
        low: number;
    };
    userProfile: {
        games: number;
        interests: number;
    };
    recommendations: RecommendationEntry[];
};

type RecommendationCacheEntry = {
    expiresAt: number;
    tagSignature: string;
    payload: RecommendationPayload;
};

const recommendationsCache = new Map<number, RecommendationCacheEntry>();

function getRecommendationStats(recommendations: RecommendationEntry[]) {
    return {
        perfect: recommendations.filter(r => r.compatibility === 'perfect').length,
        high: recommendations.filter(r => r.compatibility === 'high').length,
        good: recommendations.filter(r => r.compatibility === 'good').length,
        medium: recommendations.filter(r => r.compatibility === 'medium').length,
        low: recommendations.filter(r => r.compatibility === 'low').length
    };
}

function getCompatibility(gamesCommonCount: number, interestsCommonCount: number): RecommendationEntry['compatibility'] {
    if (gamesCommonCount >= 3) return 'perfect';
    if (gamesCommonCount >= 1) return 'high';
    if (interestsCommonCount >= 3) return 'good';
    if (interestsCommonCount >= 1) return 'medium';
    return 'low';
}

function setRecommendationCache(userId: number, entry: RecommendationCacheEntry) {
    if (recommendationsCache.size > 200) {
        const now = Date.now();
        for (const [cacheUserId, cacheEntry] of recommendationsCache.entries()) {
            if (cacheEntry.expiresAt <= now) {
                recommendationsCache.delete(cacheUserId);
            }
        }
    }

    recommendationsCache.set(userId, entry);
}

async function getTagMaps() {
    const now = Date.now();
    if (tagsCache && tagsCache.expiresAt > now) {
        return tagsCache;
    }

    const [preTagsGames, preTagsInterests] = await Promise.all([
        PreTagsGames.findAll(),
        PreTagsInterests.findAll()
    ]);

    tagsCache = {
        expiresAt: now + TAG_CACHE_TTL_MS,
        gameTagsMap: Object.fromEntries(preTagsGames.map(tag => [tag.id, tag.name])),
        interestTagsMap: Object.fromEntries(preTagsInterests.map(tag => [tag.id, tag.name]))
    };

    return tagsCache;
}

export const healthCheck = (req: Request, res: Response) => {
    res.json({'health-check': true});
};

export const addTagsInterests = async (req: Request, res: Response) => {
    try {
    const userId = Number(req.userId);
        const { pre_tag_ids } = req.body;
        if (!Array.isArray(pre_tag_ids) || pre_tag_ids.length < 3 || pre_tag_ids.length > 10) {
            return res.status(400).json({ error: 'Você deve selecionar de 3 a 10 interesses.' });
        }
        // Salva apenas os IDs
        const [tag, created] = await TagsInterests.findOrCreate({
            where: { user_id: userId },
            defaults: { user_id: userId, pre_tag_ids }
        });
        if (!created) {
            tag.pre_tag_ids = pre_tag_ids;
            await tag.save();
        }
        res.status(201).json(tag);
    } catch (err) {
        console.error('Add interests error:', err);
        res.status(500).json({ error: 'Erro ao salvar interesses.' });
    }
};

export const addTagsGames = async (req: Request, res: Response) => {
    try {
    const userId = Number(req.userId);
        const { pre_tag_ids } = req.body;
        if (!Array.isArray(pre_tag_ids) || pre_tag_ids.length < 3 || pre_tag_ids.length > 20) {
            return res.status(400).json({ error: 'Você deve selecionar de 3 a 20 jogos' });
        }
        // Salva apenas os IDs
        const [tag, created] = await TagsGames.findOrCreate({
            where: { user_id: userId },
            defaults: { user_id: userId, pre_tag_ids }
        });
        if (!created) {
            tag.pre_tag_ids = pre_tag_ids;
            await tag.save();
        }
        res.status(201).json(tag);
    } catch (err) {
        console.error('Add games error:', err);
        res.status(500).json({ error: 'Erro ao salvar jogos.' });
    }
};

export const getAllTagsInterests = async (req: Request, res: Response) => {
    try {
        const tags = await PreTagsInterests.findAll();
        res.json(tags);
    } catch (err) {
        console.error('Fetch interests error:', err);
        res.status(500).json({ error: 'Erro ao buscar interesses.' });
    }
};

export const getAllTagsGames = async (req: Request, res: Response) => {
    try {
        const tags = await PreTagsGames.findAll();
        res.json(tags);
    } catch (err) {
        console.error('Fetch games error:', err);
        res.status(500).json({ error: 'Erro ao buscar jogos.' });
    }
};

export const getUserTagsInterests = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const tag = await TagsInterests.findOne({ where: { user_id: userId } });
        res.json(tag || {});
    } catch (err) {
        console.error('Fetch user interests error:', err);
        res.status(500).json({ error: 'Erro ao buscar interesses do usuário.' });
    }
};

export const getUserTagsGames = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const tag = await TagsGames.findOne({ where: { user_id: userId } });
        res.json(tag || {});
    } catch (err) {
        console.error('Fetch user games error:', err);
        res.status(500).json({ error: 'Erro ao buscar jogos do usuário.' });
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
        console.error('Nicknames error:', err);
        res.status(500).json({ error: 'Erro ao salvar nicknames.' });
    }
};

export const getUserNicknames = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const nickname = await Nicknames.findOne({ where: { user_id: userId } });
        res.json(nickname || {});
    } catch (err) {
        console.error('Fetch nicknames error:', err);
        res.status(500).json({ error: 'Erro ao buscar nicknames.' });
    }
};

// Recomendações usuários com mais tags em comum
export const getRecommendations = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
        const cursor = Math.max(Number(req.query.cursor) || 0, 0);

        if (!userId || isNaN(userId)) {
            return res.status(401).json({ error: 'Usuário não autenticado ou ID inválido.' });
        }

        // Busca tags do usuário logado
        const userInterests = await TagsInterests.findOne({ where: { user_id: userId } });
        const userGames = await TagsGames.findOne({ where: { user_id: userId } });
        
        const userInterestIds = userInterests?.pre_tag_ids || [];
        const userGameIds = userGames?.pre_tag_ids || [];
        const tagSignature = `${userGameIds.join(',')}|${userInterestIds.join(',')}`;

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

        const excludeIds = new Set<number>([userId]);
        interactedLikes.forEach((like: any) => excludeIds.add(Number(like.to_user_id)));
        existingMatches.forEach((match: any) => {
            excludeIds.add(Number(match.user1_id));
            excludeIds.add(Number(match.user2_id));
        });

        const now = Date.now();
        const cached = recommendationsCache.get(userId);
        let payload: RecommendationPayload;

        if (cached && cached.expiresAt > now && cached.tagSignature === tagSignature) {
            payload = cached.payload;
        } else {
            const minimumCandidatesNeeded = cursor + limit + 60;
            const candidateLimit = Math.min(
                Math.max(minimumCandidatesNeeded, 150),
                RECOMMENDATIONS_CANDIDATE_WINDOW
            );

            // Janela de candidatos para evitar varrer toda a base em cada request
            const candidateUsers = await User.findAll({
                where: {
                    id: { [Op.notIn]: Array.from(excludeIds) },
                    active: true,
                    ban: false
                },
                attributes: { exclude: ['email', 'password_hash'] },
                order: [['id', 'DESC']],
                limit: candidateLimit
            });

            if (!candidateUsers.length) {
                payload = {
                    message: 'Nenhum usuário encontrado no momento. Volte mais tarde!',
                    stats: {
                        perfect: 0,
                        high: 0,
                        good: 0,
                        medium: 0,
                        low: 0
                    },
                    userProfile: {
                        games: userGameIds.length,
                        interests: userInterestIds.length
                    },
                    recommendations: []
                };
            } else {
                const userIds = candidateUsers.map(u => Number(u.id));
                const [allInterests, allGames, tagMaps] = await Promise.all([
                    TagsInterests.findAll({ where: { user_id: userIds } }),
                    TagsGames.findAll({ where: { user_id: userIds } }),
                    getTagMaps()
                ]);

                // Mapeia user_id => { interests, games }
                const userTagsMap: Record<number, { interests: number[]; games: number[] }> = {};
                for (const candidateUser of candidateUsers) {
                    userTagsMap[Number(candidateUser.id)] = { interests: [], games: [] };
                }

                for (const tag of allInterests) {
                    const userKey = Number(tag.user_id);
                    if (userTagsMap[userKey]) {
                        userTagsMap[userKey].interests = tag.pre_tag_ids || [];
                    }
                }

                for (const tag of allGames) {
                    const userKey = Number(tag.user_id);
                    if (userTagsMap[userKey]) {
                        userTagsMap[userKey].games = tag.pre_tag_ids || [];
                    }
                }

                const recommendations: RecommendationEntry[] = candidateUsers.map(otherUser => {
                    const otherTags = userTagsMap[Number(otherUser.id)] || { interests: [], games: [] };
                    const otherGameSet = new Set(otherTags.games);
                    const otherInterestSet = new Set(otherTags.interests);

                    const gamesCommon = userGameIds.filter(id => otherGameSet.has(id));
                    const interestsCommon = userInterestIds.filter(id => otherInterestSet.has(id));
                    const gameScore = gamesCommon.length * 3;
                    const interestScore = interestsCommon.length * 2;
                    const totalScore = gameScore + interestScore;

                    return {
                        user: otherUser,
                        compatibility: getCompatibility(gamesCommon.length, interestsCommon.length),
                        totalScore,
                        gameScore,
                        interestScore,
                        matches: {
                            games: {
                                count: gamesCommon.length,
                                common: gamesCommon.map(id => ({ id, name: tagMaps.gameTagsMap[id] })),
                                total: otherTags.games.length
                            },
                            interests: {
                                count: interestsCommon.length,
                                common: interestsCommon.map(id => ({ id, name: tagMaps.interestTagsMap[id] })),
                                total: otherTags.interests.length
                            }
                        },
                        percentage: Math.round(
                            ((gamesCommon.length + interestsCommon.length) /
                                Math.max(userGameIds.length + userInterestIds.length, 1)) *
                                100
                        )
                    };
                });

                // Ordena por jogos em comum, depois interesses, depois score total
                recommendations.sort((a, b) => {
                    if (a.matches.games.count !== b.matches.games.count) {
                        return b.matches.games.count - a.matches.games.count;
                    }

                    if (a.matches.interests.count !== b.matches.interests.count) {
                        return b.matches.interests.count - a.matches.interests.count;
                    }

                    return b.totalScore - a.totalScore;
                });

                payload = {
                    message: `Encontramos ${recommendations.length} pessoas para você!`,
                    stats: getRecommendationStats(recommendations),
                    userProfile: {
                        games: userGameIds.length,
                        interests: userInterestIds.length
                    },
                    recommendations
                };
            }

            setRecommendationCache(userId, {
                expiresAt: Date.now() + RECOMMENDATIONS_CACHE_TTL_MS,
                tagSignature,
                payload
            });
        }

        const sourceRecommendations = payload.recommendations;
        const safeCursor = Math.min(cursor, sourceRecommendations.length);

        let scanCursor = safeCursor;
        const paginatedRecommendations: RecommendationEntry[] = [];

        while (scanCursor < sourceRecommendations.length && paginatedRecommendations.length < limit) {
            const candidate = sourceRecommendations[scanCursor];
            if (!excludeIds.has(Number(candidate.user.id))) {
                paginatedRecommendations.push(candidate);
            }
            scanCursor += 1;
        }

        let hasMore = false;
        for (let i = scanCursor; i < sourceRecommendations.length; i += 1) {
            if (!excludeIds.has(Number(sourceRecommendations[i].user.id))) {
                hasMore = true;
                break;
            }
        }

        let filteredTotal = 0;
        const filteredStatsCounter: RecommendationEntry[] = [];
        for (const rec of sourceRecommendations) {
            if (excludeIds.has(Number(rec.user.id))) {
                continue;
            }
            filteredTotal += 1;
            filteredStatsCounter.push(rec);
        }

        const stats = getRecommendationStats(filteredStatsCounter);

        return res.json({
            message: `Encontramos ${filteredTotal} pessoas para você!`,
            stats,
            userProfile: payload.userProfile,
            recommendations: paginatedRecommendations,
            pagination: {
                cursor: safeCursor,
                nextCursor: hasMore ? scanCursor : null,
                hasMore,
                total: filteredTotal
            }
        });
    } catch (err) {
        console.error('Recommendation error:', err);
        return res.status(500).json({ error: 'Erro ao buscar recomendações.' });
    }
};

// Busca jogos de um usuário específico por ID
export const getUserGamesByUserId = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userIdNum = parseInt(id);
        
        if (!userIdNum || isNaN(userIdNum)) {
            return res.status(400).json({ error: 'ID de usuário inválido' });
        }

        // User existence check e tags em paralelo
        const [user, userGames] = await Promise.all([
            User.findByPk(userIdNum, { attributes: ['id'] }),
            TagsGames.findOne({ where: { user_id: userIdNum } })
        ]);

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

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
        res.status(500).json({ error: 'Erro ao buscar jogos do usuário.' });
    }
};

// Busca interesses de um usuário específico por ID
export const getUserInterestsByUserId = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userIdNum = parseInt(id);
        
        if (!userIdNum || isNaN(userIdNum)) {
            return res.status(400).json({ error: 'ID de usuário inválido' });
        }

        // User existence check e tags em paralelo
        const [user, userInterests] = await Promise.all([
            User.findByPk(userIdNum, { attributes: ['id'] }),
            TagsInterests.findOne({ where: { user_id: userIdNum } })
        ]);

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

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
        res.status(500).json({ error: 'Erro ao buscar interesses do usuário.' });
    }
};
