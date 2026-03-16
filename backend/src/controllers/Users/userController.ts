import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../../models/Users/User';
import { Op, QueryTypes, col, fn, where } from 'sequelize';
import sequelize from '../../database/db';
import { TagsGames } from '../../models/Tags/TagsGames';
import { TagsInterests } from '../../models/Tags/TagsInterests';
import { PreTagsGames } from '../../models/Tags/PreTagsGames';
import { PreTagsInterests } from '../../models/Tags/PreTagsInterests';

interface UserRequestBody {
    username: string;
    email: string;
    password: string;
    age: number;
    pfp?: string;
    bio?: string;
    nicknames?: string[];
}

const MIN_ADMIN_SEARCH_LENGTH = 2;

function escapeLikePattern(value: string) {
    return value.replace(/[\\%_]/g, '\\$&');
}

export const registerUser = async (req: Request<{}, {}, UserRequestBody>, res: Response) => {
    try {
        const { username, email, password, age, pfp, bio, nicknames } = req.body;

        // Verificar se usuário já existe (queries em paralelo)
        const [userExists, usernameExists] = await Promise.all([
            User.findOne({ where: { email } }),
            User.findOne({ where: { username } })
        ]);

        if (userExists) {
            return res.status(422).json({ message: "Já existe um usuário com esse email!" });
        }

        if (usernameExists) {
            return res.status(422).json({ message: "Já existe um usuário com esse username!" });
        }

        const password_hash = await bcrypt.hash(password, 12);

        const newUser = await User.create({
            username,
            email,
            password_hash,
            age,
            pfp,
            bio,
            nicknames: Array.isArray(nicknames) ? nicknames : (nicknames ? [nicknames] : [username]),
            active: true,
            is_admin: false,
            ban: false
        });

        const secret = process.env.SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is required');
        }

        const token = jwt.sign(
            { id: newUser.id },
            secret,
            { expiresIn: '7d' } // 7 dias
        );

        res.status(201).json({
            message: 'Usuário registrado com sucesso',
            user: { id: newUser.id, username: newUser.username, email: newUser.email, age: newUser.age },
            token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao registrar usuário.' });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { login, password } = req.body;

        // Busca por email ou username
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: login },
                    { username: login }
                ]
            }
        });

        // Proteção contra timing oracle: sempre executa bcrypt mesmo se o usuário não existir
        const hashToCompare = user?.password_hash ?? '$2b$12$KIXeaGKFHLjNqHXR5YaGeh9v1pHi0gjBYmf1qXfmidMxkUaHF3q6';
        const passwordValid = await bcrypt.compare(password, hashToCompare);

        if (!user || !passwordValid) {
            return res.status(401).json({ message: "Login incorreto!" });
        }

        if (user.ban) {
            return res.status(403).json({ message: "Usuário banido!" });
        }

        const secret = process.env.SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is required');
        }

        const token = jwt.sign(
            { id: user.id },
            secret,
            { expiresIn: '7d' } // 7 dias
        );

        return res.json({
            user: {
                id: user.id,
                username: user.username,
            },
            token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': 'Erro no login do usuário' });
    }
};

export const listUserbyId = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user = await User.findByPk(id, {
            attributes: { exclude: ['email', 'password_hash'] }
        });

        if (user) {
            res.status(200).json({
                user
            });
        } else {
            res.status(404).json({
                'message': 'Usuário não encontrado'
            });
        }
    } catch (error) {
        res.status(500).json({
            'error': 'Erro ao buscar usuário',
        });
    }
};

export const listUserProfileFull = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const [user, userGames, userInterests] = await Promise.all([
            User.findByPk(id, {
                attributes: { exclude: ['email', 'password_hash'] }
            }),
            TagsGames.findOne({ where: { user_id: id }, attributes: ['pre_tag_ids'] }),
            TagsInterests.findOne({ where: { user_id: id }, attributes: ['pre_tag_ids'] })
        ]);

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        const gameIds = userGames?.pre_tag_ids ?? [];
        const interestIds = userInterests?.pre_tag_ids ?? [];

        const [games, interests] = await Promise.all([
            gameIds.length > 0 ? PreTagsGames.findAll({ where: { id: gameIds } }) : Promise.resolve([]),
            interestIds.length > 0 ? PreTagsInterests.findAll({ where: { id: interestIds } }) : Promise.resolve([])
        ]);

        return res.status(200).json({
            user,
            games,
            interests,
            tagIds: {
                gameIds,
                interestIds
            }
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Erro ao buscar perfil do usuário',
        });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const paramId = Number(req.params.id);

        const canEdit = String(userId) === String(paramId) || Boolean(req.currentUser?.is_admin);
        if (!canEdit) {
            return res.status(403).json({ message: 'Você só pode atualizar o seu próprio perfil.' });
        }

        const { username, age, pfp, bio, nicknames } = req.body;

        const user = await User.findByPk(paramId);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        if (username && username !== user.username) {
            const existingUsername = await User.findOne({
                where: {
                    username,
                    id: { [Op.ne]: user.id }
                },
                attributes: ['id']
            });

            if (existingUsername) {
                return res.status(409).json({ message: 'Username já está em uso.' });
            }
        }

        // Atualiza apenas os campos permitidos (não sensíveis)
        user.username = username ?? user.username;
        user.age = age ?? user.age;
        user.pfp = pfp ?? user.pfp;
        user.bio = bio ?? user.bio;
        
        // Lógica especial para nicknames: mantém os existentes e adiciona novos
        if (nicknames) {
            const currentNicknames = user.nicknames || [];
            const newNicknames = Array.isArray(nicknames) ? nicknames : [nicknames];
            // Adiciona apenas nicknames que não existem ainda
            const uniqueNicknames = [...new Set([...currentNicknames, ...newNicknames])];
            user.nicknames = uniqueNicknames;
        }
        
        await user.save();
        const userData = user.get({ plain: true }) as any;
        delete userData.password_hash;
        res.json({ message: 'Perfil atualizado com sucesso.', user: userData });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Erro ao atualizar perfil.' });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { currentPassword, newPassword } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Verificar senha atual
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({ message: 'Senha atual incorreta.' });
        }

        // Verificar se a nova senha é diferente da atual
        const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
        if (isSamePassword) {
            return res.status(422).json({ message: 'A nova senha deve ser diferente da senha atual.' });
        }

        // Hash da nova senha
        const newPasswordHash = await bcrypt.hash(newPassword, 12);
        user.password_hash = newPasswordHash;
        await user.save();

        res.json({ message: 'Senha alterada com sucesso.' });
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ message: 'Erro ao alterar senha.' });
    }
};

export const addNicknames = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { nicknames } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const currentNicknames = user.nicknames || [];
        const newNicknames = Array.isArray(nicknames) ? nicknames : [nicknames];
        
        // Remove espaços em branco e filtra nicknames vazios
        const cleanNicknames = newNicknames
            .map(nick => nick.trim())
            .filter(nick => nick.length > 0);

        // Adiciona apenas nicknames que não existem ainda
        const uniqueNicknames = [...new Set([...currentNicknames, ...cleanNicknames])];
        
        user.nicknames = uniqueNicknames;
        await user.save();

        res.json({ 
            message: 'Nicknames adicionados com sucesso.', 
            nicknames: user.nicknames 
        });
    } catch (error) {
        console.error('Add nicknames error:', error);
        res.status(500).json({ message: 'Erro ao adicionar nicknames.' });
    }
};

// Listar todos os usuários para admin (com filtros)
export const listUsersForAdmin = async (req: Request, res: Response) => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;
        const normalizedPage = Math.min(Math.max(Number(page) || 1, 1), 1000);
        const normalizedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
        const offset = (normalizedPage - 1) * normalizedLimit;
        const normalizedSearch = typeof search === 'string' ? search.trim().toLowerCase() : '';

        const whereClause: any = {};
        
        // Filtros
        if (status === 'banned') {
            whereClause.ban = true;
        } else if (status === 'active') {
            whereClause.ban = false;
            whereClause.active = true;
        } else if (status === 'inactive') {
            whereClause.active = false;
        } else if (status === 'admin') {
            whereClause.is_admin = true;
        }

        // Busca por username ou email
        if (normalizedSearch.length >= MIN_ADMIN_SEARCH_LENGTH) {
            const escapedSearch = escapeLikePattern(normalizedSearch);
            const searchPattern = `${escapedSearch}%`;

            whereClause[Op.or] = [
                where(fn('LOWER', col('username')), { [Op.like]: searchPattern }),
                where(fn('LOWER', col('email')), { [Op.like]: searchPattern })
            ];
        }

        // findAndCountAll e aggregate de stats em paralelo (6 queries → 2 em paralelo)
        const [users, [statsRow]] = await Promise.all([
            User.findAndCountAll({
                where: whereClause,
                attributes: { exclude: ['password_hash'] },
                order: [['createdAt', 'DESC']],
                limit: normalizedLimit,
                offset
            }),
            sequelize.query<{ total: number; banned: number; active: number; inactive: number; admins: number }>(
                `SELECT
                    COUNT(*)::int                                         AS total,
                    COUNT(*) FILTER (WHERE ban = true)::int               AS banned,
                    COUNT(*) FILTER (WHERE ban = false AND active = true)::int AS active,
                    COUNT(*) FILTER (WHERE active = false)::int           AS inactive,
                    COUNT(*) FILTER (WHERE is_admin = true)::int          AS admins
                 FROM users`,
                { type: QueryTypes.SELECT }
            )
        ]);

        res.json({
            users: users.rows,
            pagination: {
                current_page: normalizedPage,
                total_pages: Math.ceil(users.count / normalizedLimit),
                total_users: users.count,
                per_page: normalizedLimit
            },
            stats: statsRow
        });
    } catch (error) {
        console.error('Erro ao listar usuários para admin:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// Banir/desbanir usuário diretamente (para admin)
export const toggleUserBan = async (req: Request<{ id: string }, {}, { ban: boolean; admin_notes?: string }>, res: Response) => {
    try {
        const targetUserId = req.params.id;
        const { ban, admin_notes } = req.body;

        const targetUser = await User.findByPk(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Não permitir banir outros admins
        if (targetUser.is_admin && ban) {
            return res.status(400).json({ message: 'Não é possível banir outros administradores.' });
        }

        targetUser.ban = ban;
        await targetUser.save();

        const action = ban ? 'banido' : 'desbanido';
        
        res.json({ 
            message: `Usuário ${targetUser.username} foi ${action} com sucesso.`,
            user: {
                id: targetUser.id,
                username: targetUser.username,
                banned: ban
            }
        });
    } catch (error) {
        console.error('Erro ao alterar status de ban:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

