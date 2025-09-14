import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../../models/Users/User';
import { Op } from 'sequelize';

interface UserRequestBody {
    username: string;
    email: string;
    password: string;
    age: number;
    pfp?: string;
    bio?: string;
    nicknames?: string[];
    active?: boolean;
    is_admin?: boolean;
    ban?: boolean;
}

export const registerUser = async (req: Request<{}, {}, UserRequestBody>, res: Response) => {
    try {
        const { username, email, password, age, pfp, bio, nicknames, active, is_admin, ban } = req.body;

        if (age < 14 || age > 99) {
            return res.status(422).json({ message: "Você precisa ter a idade mínima de 14 anos para acessar o site" });
        }

        if (bio && bio.length > 300) {
            return res.status(422).json({ message: "A descrição (bio) não pode ter mais que 300 caracteres." });
        }

        const userExists = await User.findOne({ where: { email } });
        const usernameExists = await User.findOne({ where: { username } });

        if (userExists) {
            return res.status(422).json({ message: "Já existe um usuário com esse email!" });
        }

        if (usernameExists) {
            return res.status(422).json({ message: "Já existe um usuário com esse username!" });
        }

        if (!password) {
            return res.status(422).json({ message: "Senha é obrigatória!" });
        }

        // Validação de senha forte
        const strongRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (password.length < 8) {
            return res.status(422).json({ message: "A senha deve ter pelo menos 8 caracteres." });
        }
        if (!strongRegex.test(password)) {
            return res.status(422).json({ message: "A senha deve conter pelo menos 1 letra maiúscula, 1 número e 1 caractere especial." });
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
            active: active ?? true,
            is_admin: is_admin ?? false,
            ban: ban ?? false
        });

        const token = jwt.sign(
            { id: newUser.id },
            process.env.SECRET ?? '',
            { expiresIn: 30 * 24 * 60 * 60 }
        );

        res.status(201).json({ message: 'Usuário registrado com sucesso', user: newUser, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao registrar usuário.' });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { login, password } = req.body;

        if (!login || !password) {
            return res.status(422).json({ message: "email/username e senha são obrigatórios!" });
        }

        // Busca por email ou username
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: login },
                    { username: login }
                ]
            }
        });

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(404).json({ message: "Login incorreto!" });
        }

        if (user.ban) {
            return res.status(403).json({ message: "Usuário banido!" });
        }

        const secret = process.env.SECRET ?? '';
        const token = jwt.sign(
            { id: user.id },
            secret,
            { expiresIn: 30 * 24 * 60 * 60 } // 1 month
        );

        return res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
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

export const listAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['email', 'password_hash'] }
        });

        res.status(200).json({
            users,
            message: 'Lista de usuários encontrada'
        });
    } catch (error) {
        res.status(500).json({
            'error': 'Erro ao buscar lista de usuários',
        });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const paramId = req.params.id;
        // userId pode ser string ou number, paramId é string
        if (String(userId) !== String(paramId)) {
            return res.status(403).json({ message: 'Você só pode atualizar o seu próprio perfil.' });
        }
        const { username, email, age, pfp, bio, nicknames } = req.body; // Removed sensitive fields
        
        if (bio && bio.length > 300) {
            return res.status(422).json({ message: "A descrição (bio) não pode ter mais que 300 caracteres." });
        }
        
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        
        // Atualiza apenas os campos permitidos (não sensíveis)
        user.username = username ?? user.username;
        user.email = email ?? user.email;
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
        res.json({ message: 'Perfil atualizado com sucesso.', user });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar perfil.', error });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(422).json({ message: 'Senha atual e nova senha são obrigatórias.' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Verificar senha atual
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({ message: 'Senha atual incorreta.' });
        }

        // Validar nova senha
        const strongRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (newPassword.length < 8) {
            return res.status(422).json({ message: "A nova senha deve ter pelo menos 8 caracteres." });
        }
        if (!strongRegex.test(newPassword)) {
            return res.status(422).json({ message: "A nova senha deve conter pelo menos 1 letra maiúscula, 1 número e 1 caractere especial." });
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
        res.status(500).json({ message: 'Erro ao alterar senha.', error });
    }
};

export const addNicknames = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { nicknames } = req.body;

        if (!nicknames) {
            return res.status(400).json({ message: 'Nicknames são obrigatórios.' });
        }

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
        console.error(error);
        res.status(500).json({ message: 'Erro ao adicionar nicknames.', error });
    }
};

// Listar todos os usuários para admin (com filtros)
export const listUsersForAdmin = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        
        // Verificar se é admin
        const user = await User.findByPk(userId);
        if (!user?.is_admin) {
            return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
        }

        const { status, search, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

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
        if (search) {
            whereClause[Op.or] = [
                { username: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const users = await User.findAndCountAll({
            where: whereClause,
            attributes: { exclude: ['password_hash'] },
            order: [['createdAt', 'DESC']],
            limit: Number(limit),
            offset
        });

        // Estatísticas gerais
        const stats = {
            total: await User.count(),
            banned: await User.count({ where: { ban: true } }),
            active: await User.count({ where: { ban: false, active: true } }),
            inactive: await User.count({ where: { active: false } }),
            admins: await User.count({ where: { is_admin: true } })
        };

        res.json({
            users: users.rows,
            pagination: {
                current_page: Number(page),
                total_pages: Math.ceil(users.count / Number(limit)),
                total_users: users.count,
                per_page: Number(limit)
            },
            stats
        });
    } catch (error) {
        console.error('Erro ao listar usuários para admin:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// Banir/desbanir usuário diretamente (para admin)
export const toggleUserBan = async (req: Request<{ id: string }, {}, { ban: boolean; admin_notes?: string }>, res: Response) => {
    try {
        const adminId = req.userId;
        const targetUserId = req.params.id;
        const { ban, admin_notes } = req.body;

        // Verificar se é admin
        const admin = await User.findByPk(adminId);
        if (!admin?.is_admin) {
            return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
        }

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

