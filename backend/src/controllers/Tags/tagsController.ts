import { TagsInterests } from '../../models/Tags/TagsInterests';
import { TagsGames } from '../../models/Tags/TagsGames';
import { User } from '../../models/Users/User';
import { Request, Response } from 'express';
import { PreTagsInterests } from '../../models/Tags/PreTagsInterests';
import { PreTagsGames } from '../../models/Tags/PreTagsGames';

export const healthCheck = (req: Request, res: Response) => {
    res.json({'health-check': true});
};

export const addTagsInterests = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { pre_tag_ids } = req.body;
        if (!Array.isArray(pre_tag_ids) || pre_tag_ids.length < 3 || pre_tag_ids.length > 10) {
            return res.status(400).json({ error: 'You must provide between 3 and 10 interests.' });
        }
        const preTags = await PreTagsInterests.findAll({ where: { id: pre_tag_ids } });
        if (preTags.length !== pre_tag_ids.length) {
            return res.status(400).json({ error: 'Some pre_tag_ids are invalid.' });
        }
        const names = preTags.map(tag => tag.name);
        // Atualiza ou cria único registro por usuário
        const [tag, created] = await TagsInterests.findOrCreate({
            where: { user_id: userId },
            defaults: { name: names, pre_tag_id: null }
        });
        if (!created) {
            tag.name = names;
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
            return res.status(400).json({ error: 'You must provide between 3 and 20 games.' });
        }
        const preTags = await PreTagsGames.findAll({ where: { id: pre_tag_ids } });
        if (preTags.length !== pre_tag_ids.length) {
            return res.status(400).json({ error: 'Some pre_tag_ids are invalid.' });
        }
        const names = preTags.map(tag => tag.name);
        const images = preTags.map(tag => tag.image);
        // Atualiza ou cria único registro por usuário
        const [tag, created] = await TagsGames.findOrCreate({
            where: { user_id: userId },
            defaults: { name: names, image: images, pre_tag_id: null }
        });
        if (!created) {
            tag.name = names;
            tag.image = images;
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
