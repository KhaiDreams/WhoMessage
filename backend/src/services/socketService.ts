import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { User } from '../models/Users/User';
import { Conversation } from '../models/Chat/Conversation';
import { Message } from '../models/Chat/Message';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  user?: any;
}

interface TypingUser {
  userId: number;
  username: string;
  conversationId: number;
}

class SocketService {
  private io: SocketIOServer;
  private connectedUsers = new Map<number, string>(); // userId -> socketId
  private typingUsers = new Map<number, TypingUser>(); // conversationId -> typing user

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: ['http://localhost:3000', 'https://whomessage.vercel.app', 'https://www.whomessage.chat'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        console.log('Socket auth attempt, token:', token ? 'present' : 'missing');
        
        if (!token) {
          console.log('Socket auth failed: no token');
          return next(new Error('Authentication error'));
        }

        const secret = process.env.SECRET || process.env.JWT_SECRET;
        if (!secret) {
          console.log('Socket auth failed: no JWT secret');
          return next(new Error('Server configuration error'));
        }

        const decoded = jwt.verify(token, secret) as any;
        const user = await User.findByPk(decoded.id);
        
        if (!user) {
          console.log('Socket auth failed: user not found');
          return next(new Error('User not found'));
        }

        console.log('Socket auth success for user:', user.id);
        socket.userId = decoded.id;
        socket.user = user;
        next();
      } catch (error) {
        console.log('Socket auth error:', error);
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected`);
      
      // Armazenar o usuário conectado
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id);
        
        // Notificar outros usuários que este usuário ficou online
        socket.broadcast.emit('user_online', socket.userId);
        
        // Enviar lista de usuários online para o usuário que conectou
        socket.emit('online_users', this.getOnlineUsers());
      }

      // Entrar nas conversas do usuário
      this.joinUserConversations(socket);

      // Event handlers
      socket.on('join_conversation', (conversationId: number) => {
        socket.join(`conversation_${conversationId}`);
      });

      socket.on('get_conversations', async () => {
        try {
          const conversations = await this.getUserConversations(socket.userId!);
          socket.emit('conversations_list', conversations);
        } catch (error) {
          console.error('Error getting conversations:', error);
          socket.emit('error', { message: 'Erro ao buscar conversas' });
        }
      });

      socket.on('leave_conversation', (conversationId: number) => {
        socket.leave(`conversation_${conversationId}`);
      });

      socket.on('send_message', async (data) => {
        await this.handleSendMessage(socket, data);
      });

      socket.on('typing_start', (data) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('typing_stop', (data) => {
        this.handleTypingStop(socket, data);
      });

      socket.on('mark_as_read', async (data) => {
        await this.handleMarkAsRead(socket, data);
      });

      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          this.handleUserDisconnect(socket.userId);
          
          // Notificar outros usuários que este usuário ficou offline
          socket.broadcast.emit('user_offline', socket.userId);
        }
      });
    });
  }

  private async joinUserConversations(socket: AuthenticatedSocket) {
    if (!socket.userId) return;

    try {
      const conversations = await Conversation.findAll({
        where: {
          [Op.or]: [
            { user1Id: socket.userId },
            { user2Id: socket.userId }
          ]
        }
      });

      conversations.forEach(conversation => {
        socket.join(`conversation_${conversation.id}`);
      });
    } catch (error) {
      console.error('Error joining user conversations:', error);
    }
  }

  private async getUserConversations(userId: number) {
    try {
      const conversations = await Conversation.findAll({
        where: {
          [Op.or]: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        },
        include: [
          {
            model: User,
            as: 'user1',
            attributes: ['id', 'username', 'pfp']
          },
          {
            model: User,
            as: 'user2',
            attributes: ['id', 'username', 'pfp']
          },
          {
            model: Message,
            as: 'messages',
            limit: 1,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'content', 'messageType', 'senderId', 'createdAt']
          }
        ],
        order: [['updatedAt', 'DESC']]
      });

      return conversations.map(conv => {
        const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
        const lastMessage = conv.messages && conv.messages.length > 0 ? conv.messages[0] : null;

        if (!otherUser) {
          console.error('Other user not found for conversation:', conv.id);
          return null;
        }

        return {
          id: conv.id,
          otherUser: {
            id: otherUser.id,
            username: otherUser.username,
            pfp: otherUser.pfp
          },
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.content,
            messageType: lastMessage.messageType,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt
          } : null,
          updatedAt: conv.updatedAt
        };
      }).filter(conv => conv !== null);
    } catch (error) {
      console.error('Error getting user conversations:', error);
      return [];
    }
  }

  private async handleSendMessage(socket: AuthenticatedSocket, data: {
    conversationId: number;
    content: string;
    messageType?: 'text' | 'image' | 'file';
  }) {
    try {
      if (!socket.userId) return;

      // Verificar se o usuário pertence à conversa
      const conversation = await Conversation.findOne({
        where: {
          id: data.conversationId,
          [Op.or]: [
            { user1Id: socket.userId },
            { user2Id: socket.userId }
          ]
        }
      });

      if (!conversation) {
        socket.emit('error', { message: 'Conversa não encontrada' });
        return;
      }

      // Criar a mensagem
      const message = await Message.create({
        conversationId: data.conversationId,
        senderId: socket.userId,
        content: data.content,
        messageType: data.messageType || 'text',
        isRead: false
      });

      // Buscar a mensagem com dados do remetente
      const messageWithSender = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'pfp']
          }
        ]
      });

      // Emitir para todos na conversa
      this.io.to(`conversation_${data.conversationId}`).emit('new_message', {
        id: messageWithSender!.id,
        conversationId: messageWithSender!.conversationId,
        content: messageWithSender!.content,
        messageType: messageWithSender!.messageType,
        isRead: messageWithSender!.isRead,
        createdAt: messageWithSender!.createdAt,
        sender: messageWithSender!.sender
      });

      // Parar indicador de digitação
      this.handleTypingStop(socket, { conversationId: data.conversationId });

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Erro ao enviar mensagem' });
    }
  }

  private handleTypingStart(socket: AuthenticatedSocket, data: { conversationId: number }) {
    if (!socket.userId || !socket.user) return;

    const typingUser: TypingUser = {
      userId: socket.userId,
      username: socket.user.username,
      conversationId: data.conversationId
    };

    this.typingUsers.set(data.conversationId, typingUser);

    // Emitir para outros usuários na conversa (exceto o remetente)
    socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
      userId: socket.userId,
      username: socket.user.username,
      conversationId: data.conversationId
    });
  }

  private handleTypingStop(socket: AuthenticatedSocket, data: { conversationId: number }) {
    if (!socket.userId) return;

    this.typingUsers.delete(data.conversationId);

    // Emitir para outros usuários na conversa
    socket.to(`conversation_${data.conversationId}`).emit('user_stopped_typing', {
      userId: socket.userId,
      conversationId: data.conversationId
    });
  }

  private async handleMarkAsRead(socket: AuthenticatedSocket, data: { 
    conversationId: number; 
    messageId?: number 
  }) {
    try {
      if (!socket.userId) return;

      const whereClause: any = {
        conversationId: data.conversationId,
        senderId: { [Op.ne]: socket.userId }, // Não marcar próprias mensagens como lidas
        isRead: false
      };

      if (data.messageId) {
        whereClause.id = data.messageId;
      }

      await Message.update(
        { 
          isRead: true,
          readAt: new Date()
        },
        { where: whereClause }
      );

      // Notificar outros usuários na conversa
      socket.to(`conversation_${data.conversationId}`).emit('messages_read', {
        conversationId: data.conversationId,
        readBy: socket.userId,
        messageId: data.messageId
      });

    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  private handleUserDisconnect(userId: number) {
    // Limpar indicadores de digitação do usuário
    for (const [conversationId, typingUser] of this.typingUsers.entries()) {
      if (typingUser.userId === userId) {
        this.typingUsers.delete(conversationId);
        this.io.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
          userId,
          conversationId
        });
      }
    }
  }

  // Método para verificar se um usuário está online
  public isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  // Método para obter status de usuários online
  public getOnlineUsers(): number[] {
    return Array.from(this.connectedUsers.keys());
  }
}

export { SocketService };