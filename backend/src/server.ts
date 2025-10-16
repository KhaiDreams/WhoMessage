import express, { Request, Response } from 'express';
import { createServer } from 'http';
import helmet from 'helmet';
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
import { generalLimiter } from './middlewares/rateLimiter';

const server = express();
const httpServer = createServer(server);

// Inicializar Socket.IO
const socketService = new SocketService(httpServer);

// Configurações de segurança
server.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

server.use(express.json({ limit: '5mb' }));
server.use(express.urlencoded({ limit: '5mb', extended: true }));
const allowedOrigins = [
  'http://localhost:3000',
  'https://whomessage.vercel.app',
  'https://www.whomessage.chat'
];

server.use(cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, desktop apps, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Não permitido pelo CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200, // Para suporte a browsers legados
  maxAge: 86400 // Cache preflight por 24 horas
}));

// Aplicar rate limiting geral
server.use(generalLimiter);

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
