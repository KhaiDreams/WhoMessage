declare namespace Express {
    export interface Request {
        userId: string;
        currentUser?: import('../models/Users/User').UserInstance;
    }
}