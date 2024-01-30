import { Request, Response } from 'express';

export const healthCheck = (req: Request, res: Response) => {
    res.json({'health-check': true});
};
