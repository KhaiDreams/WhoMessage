import { Request, Response } from 'express';
import { Like } from '../../models/Interactions/Like';
import { Match } from '../../models/Interactions/Match';
import { Notification } from '../../models/Interactions/Notification';
import { User } from '../../models/Users/User';

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

        // Verifica se já existe uma interação
        const { Op } = require('sequelize');
        const existingLike = await Like.findOne({
            where: {
                from_user_id: fromUserId,
                to_user_id: to_user_id
            }
        });

        if (existingLike) {
            return res.status(400).json({ error: 'Você já interagiu com este usuário.' });
        }

        // Cria a curtida/pass
        const like = await Like.create({
            from_user_id: fromUserId,
            to_user_id: to_user_id,
            action
        });

        // Se foi um like, verifica se há match
        let match = null;
        if (action === 'like') {
            // Verifica se o outro usuário também curtiu
            const reciprocalLike = await Like.findOne({
                where: {
                    from_user_id: to_user_id,
                    to_user_id: fromUserId,
                    action: 'like'
                }
            });

            if (reciprocalLike) {
                // Cria o match (user1_id sempre menor que user2_id para evitar duplicatas)
                const user1_id = Math.min(fromUserId, to_user_id);
                const user2_id = Math.max(fromUserId, to_user_id);

                match = await Match.create({
                    user1_id,
                    user2_id
                });

                // Busca dados dos usuários para notificações
                const [fromUser, toUser] = await Promise.all([
                    User.findByPk(fromUserId, { attributes: ['id', 'username'] }),
                    User.findByPk(to_user_id, { attributes: ['id', 'username'] })
                ]);

                // Cria notificações de match para ambos
                await Promise.all([
                    Notification.create({
                        user_id: fromUserId,
                        from_user_id: to_user_id,
                        type: 'match_created',
                        title: '🎉 Novo Match!',
                        message: `Você e ${toUser?.username} se curtiram! Agora vocês podem conversar.`
                    }),
                    Notification.create({
                        user_id: to_user_id,
                        from_user_id: fromUserId,
                        type: 'match_created',
                        title: '🎉 Novo Match!',
                        message: `Você e ${fromUser?.username} se curtiram! Agora vocês podem conversar.`
                    })
                ]);
            } else {
                // Apenas um like, cria notificação para o usuário que recebeu
                const fromUser = await User.findByPk(fromUserId, { attributes: ['id', 'username'] });
                
                await Notification.create({
                    user_id: to_user_id,
                    from_user_id: fromUserId,
                    type: 'like_received',
                    title: '💖 Alguém curtiu você!',
                    message: `${fromUser?.username} curtiu seu perfil! Que tal dar uma olhada?`
                });
            }
        }

        res.json({
            success: true,
            action,
            match: !!match,
            message: match ? 'É um match! 🎉' : action === 'like' ? 'Like enviado!' : 'Usuário passado.'
        });
    } catch (err) {
        console.error('Like error:', err);
        res.status(500).json({ error: 'Erro ao processar like', details: err });
    }
};

// Buscar notificações do usuário
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);
        const { page = 1, limit = 20 } = req.query;

        const offset = (Number(page) - 1) * Number(limit);

        const notifications = await Notification.findAndCountAll({
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
        });

        res.json({
            notifications: notifications.rows,
            pagination: {
                total: notifications.count,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(notifications.count / Number(limit))
            },
            unreadCount: await Notification.count({
                where: { user_id: userId, read: false }
            })
        });
    } catch (err) {
        console.error('Notifications error:', err);
        res.status(500).json({ error: 'Erro ao buscar notificações', details: err });
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
        res.status(500).json({ error: 'Erro ao marcar notificação', details: err });
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
        res.status(500).json({ error: 'Erro ao marcar notificações', details: err });
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
        res.status(500).json({ error: 'Erro ao buscar matches', details: err });
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
        const likesWithoutMatch = [];
        for (const like of pendingLikes) {
            const existingMatch = await Match.findOne({
                where: {
                    [Op.or]: [
                        { user1_id: Math.min(userId, like.from_user_id), user2_id: Math.max(userId, like.from_user_id) }
                    ]
                }
            });
            
            if (!existingMatch) {
                likesWithoutMatch.push({
                    id: like.id,
                    created_at: like.created_at,
                    fromUser: (like as any).fromUser
                });
            }
        }

        res.json(likesWithoutMatch);
    } catch (err) {
        console.error('Pending likes error:', err);
        res.status(500).json({ error: 'Erro ao buscar curtidas pendentes', details: err });
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
        res.status(500).json({ error: 'Erro ao desfazer match', details: err });
    }
};
