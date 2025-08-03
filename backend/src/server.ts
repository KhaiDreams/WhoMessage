import express, { Request, Response } from 'express';
import './models/associations'; // Importar associações ANTES dos routes
import apiRouters from './routes/user';
import tagsRouters from './routes/tags';
import feedbackRoutes from './routes/feedback';
import meRoutes from './routes/me';
import interactionsRoutes from './routes/interactions';
import cors from 'cors';

const server = express();

server.use(express.json());
const allowedOrigins = [
  'http://localhost:3000',
  'https://whomessage.vercel.app'
];
server.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

server.use('/', apiRouters);
server.use('/api', tagsRouters);
server.use('/api/feedback', feedbackRoutes);
server.use('/api/user/me', meRoutes);
server.use('/api', interactionsRoutes);

const PORT = process.env.PORT;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

server.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Página não encontrada.' });
});
