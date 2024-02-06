import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../../models/Users/User';

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;

        const userExists = await User.findOne({ where: { email } });

        if (userExists) {
            return res.status(422).json({ message: "Já existe um usuário com esse email!" });
        }

        const newUser = await User.create({
            username,
            email,
            password: await bcrypt.hash(password, 12),
        });

        res.status(201).json({ message: 'Usuário registrado com sucesso', user: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao registrar usuário.' });
    }
};


export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(422).json({ message: "E-mail e senha são obrigatórios!" });
        }

        const user = await User.findOne({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(404).json({ message: "Login incorreto!" });
        }

        const secret = process.env.SECRET ?? '';
        const token = jwt.sign(
            { id: user.id },
            secret,
            { expiresIn: 24 * 60 * 60 }
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
}


export const listUserbyId = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user = await User.findByPk(id, {
            attributes: { exclude: ['email', 'password'] }
        });

        if (user) {
            res.status(200).json({
                user,
                'message': 'Usuário encontrado'
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
            attributes: { exclude: ['email', 'password'] }
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
        const id = Number(req.params.id);
        const { email, username, description, profilepicture } = req.body;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                message: 'Usuário não encontrado',
            });
        }

        const updatedUser = await user.update({
            email,
            username,
            description,
            profilepicture,
        });

        res.status(200).json({ user: updatedUser, message: "Usuário editado com sucesso" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);

        const deletedUser = await User.destroy({ where: { id } });

        if (deletedUser) {
            res.status(200).json({ message: "Usuário removido com sucesso" });
        } else {
            res.status(404).json({ message: 'Usuário não encontrado' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir usuário' });
    }
};
