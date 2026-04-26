import express, { NextFunction, Request, Response } from 'express';
import { createServer } from 'http';
import https from 'https';
import helmet from 'helmet';
import multer from 'multer';
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
import { getAllowedOrigins } from './config/cors';

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

server.use(express.json({ limit: '1mb' }));
server.use(express.urlencoded({ limit: '1mb', extended: true }));
const allowedOrigins = getAllowedOrigins();

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

// Health check endpoint (usado pelo self-ping e por monitores externos)
server.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
});

server.use('/', apiRouters);
server.use('/api', tagsRouters);
server.use('/api/feedback', feedbackRoutes);
server.use('/api/user', meRoutes);
server.use('/api', interactionsRoutes);
server.use('/api', reportsRoutes);
server.use('/api/chat', chatRoutes);

// 404 fallback — deve ficar antes do error handler e do listen()
server.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Rota não encontrada.' });
});

// Global error handler
server.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'IMAGE_TOO_LARGE', message: 'Arquivo muito grande.' });
        }
        return res.status(400).json({ error: 'UPLOAD_ERROR', message: err.message });
    }

    // Erros HTTP explícitos (ex: CORS)
    const statusCode = typeof err.status === 'number' && err.status >= 400 ? err.status : 500;
    if (statusCode >= 500) {
        console.error('Unhandled error:', err);
        return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' });
    }

    return res.status(statusCode).json({ error: 'BAD_REQUEST', message: err.message || 'Requisição inválida.' });
});

const PORT = process.env.PORT;
httpServer.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);

    // Self-ping a cada 14 minutos para evitar cold start no Render (free tier dorme após 15 min)
    const SELF_URL = process.env.RENDER_EXTERNAL_URL;
    if (SELF_URL) {
        setInterval(() => {
            https.get(`${SELF_URL}/health`, (res) => {
                console.log(`[keep-alive] ping → ${res.statusCode}`);
            }).on('error', (err) => {
                console.warn('[keep-alive] erro no ping:', err.message);
            });
        }, 14 * 60 * 1000);
    }
});
