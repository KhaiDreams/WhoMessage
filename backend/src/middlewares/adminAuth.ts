import { Request, Response, NextFunction } from 'express';

// req.currentUser is set by AuthMiddleware — no extra DB query needed here
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.currentUser?.is_admin) {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
  }
  return next();
};

export const requireSelfOrAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const targetId = req.params.id;
  if (String(req.userId) === String(targetId) || req.currentUser?.is_admin) {
    return next();
  }
  return res.status(403).json({ message: 'Você só pode acessar seus próprios dados' });
};