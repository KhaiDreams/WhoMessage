import express, { Request, Response } from 'express';
import { createServer } from 'http';
import './models/associations'; // Importar associações ANTES dos routes
import apiRouters from './routes/user';
import tagsRouters from './routes/tags';
import feedbackRoutes from './routes/feedback';
import meRoutes from './routes/me';
import interactionsRoutes from './routes/interactions';
import reportsRoutes from './routes/reports';
import chatRoutes from './routes/chat';
import cors from 'cors';
import { SocketService } from './services/socketService';

const server = express();
const httpServer = createServer(server);

// Inicializar Socket.IO
const socketService = new SocketService(httpServer);

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
server.use('/api', reportsRoutes);
server.use('/api/chat', chatRoutes);

const PORT = process.env.PORT;
httpServer.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

server.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Página não encontrada.' });
});
