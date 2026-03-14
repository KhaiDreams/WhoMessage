import { Request, Response } from 'express';
import { Feedback } from '../../models/Feedback/Feedback';
import { User } from '../../models/Users/User';

export const createFeedback = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { message } = req.body;
    if (!message || message.trim().length < 3) {
      return res.status(400).json({ message: 'Mensagem de feedback muito curta.' });
    }
    const feedback = await Feedback.create({
      user_id: Number(userId),
      message: message.trim(),
    });
    res.status(201).json({ message: 'Feedback enviado com sucesso!', feedback });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ message: 'Erro ao enviar feedback.' });
  }
};

export const listFeedbacks = async (req: Request, res: Response) => {
  try {
    // req.currentUser is set by AuthMiddleware — no extra DB query needed
    if (!req.currentUser?.is_admin) {
      return res.status(403).json({ message: 'Acesso restrito a administradores.' });
    }
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const { count, rows } = await Feedback.findAndCountAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email', 'is_admin'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });
    res.json({
      feedbacks: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('List feedbacks error:', error);
    res.status(500).json({ message: 'Erro ao buscar feedbacks.' });
  }
};
