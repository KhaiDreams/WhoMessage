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

        const errors = [
            !password && "Senha é obrigatória!",
            age < 14 || age > 99 && "Você precisa ter entre 14 e 99 anos para acessar o site",
            await User.findOne({ where: { email } }) && "Já existe um usuário com esse email!",
            await User.findOne({ where: { username } }) && "Já existe um usuário com esse username!"
        ].filter(Boolean);

        if (errors.length > 0) {
            return res.status(422).json({ message: errors[0] });
        }

        const password_hash = await bcrypt.hash(password, 12);

        const newUser = await User.create({
            username,
            email,
            password_hash,
            age,
            pfp,
            bio,
            nicknames: nicknames?.length ? nicknames : [username],
            active,
            is_admin,
            ban
        });

        return res.status(201).json({ message: 'Usuário registrado com sucesso', user: newUser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao registrar usuário.' });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(422).json({ message: "E-mail e senha são obrigatórios!" });
        }

        const user = await User.findOne({ where: { email } });

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

export const updateUser = async (req: Request<{ id: string }, {}, UserRequestBody>, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { email, username, password, pfp, bio, age, nicknames, active, is_admin, ban } = req.body;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                message: 'Usuário não encontrado',
            });
        }

        if (age && (age < 14 || age > 99)) {
            return res.status(422).json({ message: "Você precisa ter a idade mínima para acessar o site" });
        }

        if (username) {
            const usernameExists = await User.findOne({ where: { username, id: { [Op.ne]: id } } });

            if (usernameExists) {
                return res.status(422).json({ message: "Já existe um usuário com esse username!" });
            }
        }

        const updatedData: Partial<UserRequestBody> & { password_hash?: string } = {
            email,
            username,
            pfp,
            bio,
            age,
            nicknames: nicknames && nicknames.length > 0 ? nicknames : [username],
            active,
            is_admin,
            ban
        };

        if (password) {
            updatedData.password_hash = await bcrypt.hash(password, 12);
        }

        if (nicknames) {
            updatedData.nicknames = Array.isArray(nicknames) ? nicknames : [nicknames];
        }

        const updatedUser = await user.update(updatedData);

        res.status(200).json({ user: updatedUser, message: "Perfil atualizado com sucesso" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar perfil.' });
    }
};

