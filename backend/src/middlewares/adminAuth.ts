import { Request, Response, NextFunction } from 'express';
import { User } from '../models/Users/User';

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    if (!user.is_admin) {
      return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const requireSelfOrAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const targetId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    // Permite se for o próprio usuário ou se for admin
    if (String(userId) === String(targetId) || user.is_admin) {
      return next();
    }

    return res.status(403).json({ message: 'Você só pode acessar seus próprios dados' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};