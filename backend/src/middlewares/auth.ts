import { verify } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { User } from '../models/Users/User';

interface TokenPayload {
    id: string;
    iat: number;
    exp: number;
}

export async function AuthMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const { authorization } = req.headers;
    
    if (!authorization) {
        return res.status(401).json({ message: "Acesso não autorizado" });
    }

    const token = authorization.split(" ")[1];
    const secret = process.env.SECRET;

    try {
        const data = verify(token, secret ?? '') as TokenPayload;
        const { id } = data;
        const user = await User.findByPk(id);
        console.log('token', token);

        if (!user) {
            return res.status(401).json({ message: "Usuário não encontrado" });
        }

        req.userId = id;
        return next();
    } catch (error) {
        return res.status(401).json({ message: "Token inválido" });
    }
}
