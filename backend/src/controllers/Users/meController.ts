import { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import sequelize from '../../database/db';
import { User } from '../../models/Users/User';
import { TagsGames } from '../../models/Tags/TagsGames';
import { TagsInterests } from '../../models/Tags/TagsInterests';
import { PreTagsGames } from '../../models/Tags/PreTagsGames';
import { PreTagsInterests } from '../../models/Tags/PreTagsInterests';
import { Notification } from '../../models/Interactions/Notification';

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] }
    });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar usuário.', error });
  }
};

export const getBootstrap = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.userId);

    const [user, userGames, userInterests, unreadNotifications, unreadMessagesResult] = await Promise.all([
      User.findByPk(userId, { attributes: { exclude: ['password_hash'] } }),
      TagsGames.findOne({ where: { user_id: userId }, attributes: ['pre_tag_ids'] }),
      TagsInterests.findOne({ where: { user_id: userId }, attributes: ['pre_tag_ids'] }),
      Notification.count({ where: { user_id: userId, read: false } }),
      sequelize.query<{ count: number }>(
        `SELECT COUNT(*)::int AS count
         FROM messages
         WHERE is_read = false
           AND sender_id != :userId
           AND conversation_id IN (
             SELECT id FROM conversations
             WHERE user1_id = :userId OR user2_id = :userId
           )`,
        {
          replacements: { userId },
          type: QueryTypes.SELECT
        }
      )
    ]);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const gameIds = userGames?.pre_tag_ids ?? [];
    const interestIds = userInterests?.pre_tag_ids ?? [];

    return res.json({
      user,
      setupStatus: {
        hasProfile: Boolean(user.username && user.age),
        hasGames: gameIds.length >= 3,
        hasInterests: interestIds.length >= 3
      },
      tags: {
        gameIds,
        interestIds
      },
      unread: {
        notifications: unreadNotifications,
        messages: unreadMessagesResult[0]?.count ?? 0
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao buscar bootstrap do usuário.' });
  }
};

export const getMyProfileFull = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.userId);

    const [user, userGames, userInterests] = await Promise.all([
      User.findByPk(userId, { attributes: { exclude: ['password_hash'] } }),
      TagsGames.findOne({ where: { user_id: userId }, attributes: ['pre_tag_ids'] }),
      TagsInterests.findOne({ where: { user_id: userId }, attributes: ['pre_tag_ids'] })
    ]);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const gameIds = userGames?.pre_tag_ids ?? [];
    const interestIds = userInterests?.pre_tag_ids ?? [];

    const [games, interests] = await Promise.all([
      gameIds.length > 0 ? PreTagsGames.findAll({ where: { id: gameIds } }) : Promise.resolve([]),
      interestIds.length > 0 ? PreTagsInterests.findAll({ where: { id: interestIds } }) : Promise.resolve([])
    ]);

    return res.json({
      user,
      games,
      interests,
      tagIds: {
        gameIds,
        interestIds
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao buscar perfil completo.' });
  }
};
