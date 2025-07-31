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
