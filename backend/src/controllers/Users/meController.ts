import { Request, Response } from 'express';
import { User } from '../../models/Users/User';

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
