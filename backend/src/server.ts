import express, { Request, Response } from 'express';
import apiRouters from './routes/api';
import cors from 'cors';

const server = express();

server.use(express.json());
server.use(cors({
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

server.use('/', apiRouters);

const PORT = process.env.PORT;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

server.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Página não encontrada.' });
});
