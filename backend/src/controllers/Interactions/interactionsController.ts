import { Request, Response } from 'express';
import { Like } from '../../models/Interactions/Like';
import { Match } from '../../models/Interactions/Match';
import { Notification } from '../../models/Interactions/Notification';
import { User } from '../../models/Users/User';
import sequelize from '../../database/db';

// Curtir ou passar um usuário
export const likeUser = async (req: Request, res: Response) => {
    try {
        const fromUserId = Number(req.userId);
        const { to_user_id, action } = req.body;

        if (!to_user_id || !action || !['like', 'pass'].includes(action)) {
            return res.status(400).json({ error: 'to_user_id e action (like/pass) são obrigatórios.' });
        }

        if (fromUserId === to_user_id) {
            return res.status(400).json({ error: 'Você não pode curtir a si mesmo.' });
        }

        const result = await sequelize.transaction(async (transaction) => {
            const targetUser = await User.findByPk(to_user_id, {
                attributes: ['id', 'username', 'active', 'ban'],
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!targetUser) {
                throw { status: 404, error: 'Usuário alvo não encontrado.' };
            }

            if (targetUser.ban || targetUser.active === false) {
                throw { status: 403, error: 'Usuário indisponível para interação.' };
            }

            let existingLike = await Like.findOne({
                where: {
                    from_user_id: fromUserId,
                    to_user_id: to_user_id
                },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (existingLike) {
                // Permite substituir um 'pass' anterior por um 'like' (ex: curtir de volta via notificação)
                if (existingLike.action === 'pass' && action === 'like') {
                    existingLike.action = 'like';
                    await existingLike.save({ transaction });
                } else {
                    throw { status: 400, error: 'Você já interagiu com este usuário.' };
                }
            }

            // Cria ou reutiliza a interação
            if (!existingLike) {
                existingLike = await Like.create({
                    from_user_id: fromUserId,
                    to_user_id: to_user_id,
                    action
                }, { transaction });
            }

            // Se foi um like, verifica se há match
            let match = null;
            let isMatchCreated = false;
            if (action === 'like') {
                // Verifica se o outro usuário também curtiu
                const reciprocalLike = await Like.findOne({
                    where: {
                        from_user_id: to_user_id,
                        to_user_id: fromUserId,
                        action: 'like'
                    },
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                if (reciprocalLike) {
                    // Cria ou reativa o match (user1_id sempre menor que user2_id para evitar duplicatas)
                    const user1_id = Math.min(fromUserId, to_user_id);
                    const user2_id = Math.max(fromUserId, to_user_id);

                    match = await Match.findOne({
                        where: { user1_id, user2_id },
                        transaction,
                        lock: transaction.LOCK.UPDATE
                    });

                    if (!match) {
                        match = await Match.create({
                            user1_id,
                            user2_id
                        }, { transaction });
                        isMatchCreated = true;
                    } else if (!match.chat_active) {
                        match.chat_active = true;
                        await match.save({ transaction });
                        isMatchCreated = true;
                    }

                    if (isMatchCreated) {
                        // Cria notificações de match para ambos
                        const fromUsername = req.currentUser?.username ?? 'alguém';
                        await Promise.all([
                            Notification.create({
                                user_id: fromUserId,
                                from_user_id: to_user_id,
                                type: 'match_created',
                                title: '🎉 Novo Match!',
                                message: `Você e ${targetUser.username} se curtiram! Agora vocês podem conversar.`
                            }, { transaction }),
                            Notification.create({
                                user_id: to_user_id,
                                from_user_id: fromUserId,
                                type: 'match_created',
                                title: '🎉 Novo Match!',
                                message: `Você e ${fromUsername} se curtiram! Agora vocês podem conversar.`
                            }, { transaction })
                        ]);
                    }
                } else {
                    // Apenas um like, cria notificação para o usuário que recebeu
                    const fromUsername = req.currentUser?.username
                        ?? (await User.findByPk(fromUserId, { attributes: ['username'], transaction }))?.username
                        ?? 'alguém';

                    await Notification.create({
                        user_id: to_user_id,
                        from_user_id: fromUserId,
                        type: 'like_received',
                        title: '💖 Alguém curtiu você!',
                        message: `${fromUsername} curtiu seu perfil! Que tal dar uma olhada?`
                    }, { transaction });
                }
            }

            return {
                action,
                match: isMatchCreated
            };
        });

        res.json({
            success: true,
            action: result.action,
            match: result.match,
            message: result.match ? 'É um match! 🎉' : result.action === 'like' ? 'Like enviado!' : 'Usuário passado.'
        });
    } catch (err: any) {
        if (err?.status) {
            return res.status(err.status).json({ error: err.error });
        }

        if (err?.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'Interação já registrada. Atualize a tela e tente novamente.' });
        }

        console.error('Like error:', err);
        res.status(500).json({ error: 'Erro ao processar like' });
    }
};

// Buscar notificações do usuário
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);
        const { page = 1, limit = 20 } = req.query;
        const { Op } = require('sequelize');

        const offset = (Number(page) - 1) * Number(limit);

        const [notifications, unreadCount] = await Promise.all([
            Notification.findAndCountAll({
                where: { user_id: userId },
                include: [{
                    model: User,
                    as: 'fromUser',
                    attributes: ['id', 'username', 'pfp'],
                    required: false
                }],
                order: [['created_at', 'DESC']],
                limit: Number(limit),
                offset
            }),
            Notification.count({ where: { user_id: userId, read: false } })
        ]);

        const likeNotifications = notifications.rows.filter((n: any) => n.type === 'like_received' && n.from_user_id);
        const fromUserIds = Array.from(new Set(likeNotifications.map((n: any) => Number(n.from_user_id))));

        let interactedUserIds = new Set<number>();

        if (fromUserIds.length > 0) {
            const [alreadyInteracted, existingMatches] = await Promise.all([
                Like.findAll({
                    where: {
                        from_user_id: userId,
                        to_user_id: { [Op.in]: fromUserIds }
                    },
                    attributes: ['to_user_id']
                }),
                Match.findAll({
                    where: {
                        [Op.or]: [
                            { user1_id: userId, user2_id: { [Op.in]: fromUserIds } },
                            { user1_id: { [Op.in]: fromUserIds }, user2_id: userId }
                        ]
                    },
                    attributes: ['user1_id', 'user2_id']
                })
            ]);

            alreadyInteracted.forEach((like: any) => interactedUserIds.add(Number(like.to_user_id)));
            existingMatches.forEach((match: any) => {
                const otherId = Number(match.user1_id) === userId ? Number(match.user2_id) : Number(match.user1_id);
                interactedUserIds.add(otherId);
            });
        }

        const formattedNotifications = notifications.rows.map((notification: any) => {
            const plain = notification.toJSON ? notification.toJSON() : notification;

            if (plain.type === 'like_received' && plain.from_user_id) {
                return {
                    ...plain,
                    canLikeBack: !interactedUserIds.has(Number(plain.from_user_id))
                };
            }

            return {
                ...plain,
                canLikeBack: false
            };
        });

        res.json({
            notifications: formattedNotifications,
            pagination: {
                total: notifications.count,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(notifications.count / Number(limit))
            },
            unreadCount
        });
    } catch (err) {
        console.error('Notifications error:', err);
        res.status(500).json({ error: 'Erro ao buscar notificações' });
    }
};

// Marcar notificação como lida
export const markNotificationAsRead = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);
        const { notificationId } = req.params;

        const notification = await Notification.findOne({
            where: { id: notificationId, user_id: userId }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notificação não encontrada.' });
        }

        notification.read = true;
        await notification.save();

        res.json({ success: true, message: 'Notificação marcada como lida.' });
    } catch (err) {
        console.error('Mark notification error:', err);
        res.status(500).json({ error: 'Erro ao marcar notificação' });
    }
};

// Marcar todas as notificações como lidas
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);

        await Notification.update(
            { read: true },
            { where: { user_id: userId, read: false } }
        );

        res.json({ success: true, message: 'Todas as notificações foram marcadas como lidas.' });
    } catch (err) {
        console.error('Mark all notifications error:', err);
        res.status(500).json({ error: 'Erro ao marcar notificações' });
    }
};

// Limpar (apagar) todas as notificações do usuário
export const clearNotifications = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);

        const deleted = await Notification.destroy({ where: { user_id: userId } });

        res.json({ success: true, deleted, message: 'Notificações apagadas com sucesso.' });
    } catch (err) {
        console.error('Clear notifications error:', err);
        res.status(500).json({ error: 'Erro ao limpar notificações' });
    }
};

// Buscar matches do usuário
export const getMatches = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);
        const { Op } = require('sequelize');

        const matches = await Match.findAll({
            where: {
                [Op.or]: [
                    { user1_id: userId },
                    { user2_id: userId }
                ],
                chat_active: true
            },
            include: [
                {
                    model: User,
                    as: 'user1',
                    attributes: ['id', 'username', 'pfp', 'bio', 'age'],
                    required: true
                },
                {
                    model: User,
                    as: 'user2',
                    attributes: ['id', 'username', 'pfp', 'bio', 'age'],
                    required: true
                }
            ],
            order: [['matched_at', 'DESC']]
        });

        // Formata para mostrar sempre o outro usuário
        const formattedMatches = matches.map((match: any) => {
            const otherUser = match.user1_id === userId ? match.user2 : match.user1;
            return {
                id: match.id,
                matched_at: match.matched_at,
                otherUser,
                chat_active: match.chat_active
            };
        });

        res.json(formattedMatches);
    } catch (err) {
        console.error('Matches error:', err);
        res.status(500).json({ error: 'Erro ao buscar matches' });
    }
};

// Buscar curtidas recebidas pendentes
export const getPendingLikes = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);
        const { Op } = require('sequelize');

        // Busca likes recebidos que ainda não foram correspondidos
        const pendingLikes = await Like.findAll({
            where: {
                to_user_id: userId,
                action: 'like'
            },
            include: [{
                model: User,
                as: 'fromUser',
                attributes: ['id', 'username', 'pfp', 'bio', 'age'],
                required: true
            }],
            order: [['created_at', 'DESC']]
        });

        // Filtra apenas os que não viraram match ainda
        const fromUserIds = pendingLikes.map(like => like.from_user_id);

        // Busca todos os matches relevantes em UMA query (evita N+1)
        const existingMatches = fromUserIds.length > 0
            ? await Match.findAll({
                where: {
                    [Op.or]: [
                        { user1_id: userId, user2_id: { [Op.in]: fromUserIds } },
                        { user1_id: { [Op.in]: fromUserIds }, user2_id: userId }
                    ]
                },
                attributes: ['user1_id', 'user2_id']
            })
            : [];

        const matchedUserIds = new Set<number>();
        existingMatches.forEach((m: any) => {
            matchedUserIds.add(m.user1_id === userId ? m.user2_id : m.user1_id);
        });

        const likesWithoutMatch = pendingLikes
            .filter(like => !matchedUserIds.has(like.from_user_id))
            .map(like => ({
                id: like.id,
                created_at: like.created_at,
                fromUser: (like as any).fromUser
            }));

        res.json(likesWithoutMatch);
    } catch (err) {
        console.error('Pending likes error:', err);
        res.status(500).json({ error: 'Erro ao buscar curtidas pendentes' });
    }
};

// Desfazer um match
export const unmatch = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);
        const { matchId } = req.params;

        if (!matchId) {
            return res.status(400).json({ error: 'ID do match é obrigatório.' });
        }

        // Busca o match e verifica se o usuário faz parte dele
        const { Op } = require('sequelize');
        const match = await Match.findOne({
            where: {
                id: matchId,
                [Op.or]: [
                    { user1_id: userId },
                    { user2_id: userId }
                ]
            }
        });

        if (!match) {
            return res.status(404).json({ error: 'Match não encontrado ou você não faz parte dele.' });
        }

        // Remove o match (soft delete - desativa o chat)
        match.chat_active = false;
        await match.save();

        // Busca o outro usuário para a notificação
        const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
        const currentUser = await User.findByPk(userId, { attributes: ['id', 'username'] });

        // Cria notificação para o outro usuário
        await Notification.create({
            user_id: otherUserId,
            from_user_id: userId,
            type: 'match_created', // Reutilizamos o tipo existente
            title: '💔 Match desfeito',
            message: `${currentUser?.username} desfez o match com você.`
        });

        res.json({
            success: true,
            message: 'Match desfeito com sucesso.',
            matchId: match.id
        });
    } catch (err) {
        console.error('Unmatch error:', err);
        res.status(500).json({ error: 'Erro ao desfazer match' });
    }
};
