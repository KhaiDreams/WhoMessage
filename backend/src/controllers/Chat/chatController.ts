import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Conversation } from '../../models/Chat/Conversation';
import { Message } from '../../models/Chat/Message';
import { User } from '../../models/Users/User';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
  };
}

export class ChatController {
  
  // Listar conversas do usuário
  static async getConversations(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

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
            include: [
              {
                model: User,
                as: 'sender',
                attributes: ['id', 'username']
              }
            ]
          }
        ],
        order: [['updatedAt', 'DESC']]
      });

      // Formatar dados para incluir informações do chat partner e última mensagem
      const formattedConversations = conversations.map(conv => {
        const isUser1 = conv.user1Id === userId;
        const chatPartner = isUser1 ? conv.user2 : conv.user1;
        const lastMessage = conv.messages?.[0];

        return {
          id: conv.id,
          chatPartner: {
            id: chatPartner?.id,
            username: chatPartner?.username,
            pfp: chatPartner?.pfp
          },
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.content,
            messageType: lastMessage.messageType,
            senderId: lastMessage.senderId,
            isFromMe: lastMessage.senderId === userId,
            createdAt: lastMessage.createdAt
          } : null,
          updatedAt: conv.updatedAt
        };
      });

      return res.json({ conversations: formattedConversations });

    } catch (error) {
      console.error('Error getting conversations:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter ou criar conversa entre dois usuários
  static async getOrCreateConversation(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { targetUserId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      if (userId === parseInt(targetUserId)) {
        return res.status(400).json({ error: 'Não é possível criar conversa consigo mesmo' });
      }

      // Verificar se o usuário alvo existe
      const targetUser = await User.findByPk(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Procurar conversa existente
      let conversation = await Conversation.findOne({
        where: {
          [Op.or]: [
            { user1Id: userId, user2Id: targetUserId },
            { user1Id: targetUserId, user2Id: userId }
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
          }
        ]
      });

      // Se não existir, criar nova conversa
      if (!conversation) {
        conversation = await Conversation.create({
          user1Id: Math.min(userId, parseInt(targetUserId)),
          user2Id: Math.max(userId, parseInt(targetUserId))
        });

        // Buscar novamente com includes
        conversation = await Conversation.findByPk(conversation.id, {
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
            }
          ]
        });
      }

      // Formatar resposta
      const isUser1 = conversation!.user1Id === userId;
      const chatPartner = isUser1 ? conversation!.user2 : conversation!.user1;

      return res.json({
        conversation: {
          id: conversation!.id,
          chatPartner: {
            id: chatPartner?.id,
            username: chatPartner?.username,
            pfp: chatPartner?.pfp
          },
          createdAt: conversation!.createdAt
        }
      });

    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter mensagens de uma conversa
  static async getMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { conversationId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se o usuário pertence à conversa
      const conversation = await Conversation.findOne({
        where: {
          id: conversationId,
          [Op.or]: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        }
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversa não encontrada' });
      }

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      const messages = await Message.findAll({
        where: {
          conversationId: conversationId
        },
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'pfp']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit as string),
        offset: offset
      });

      // Inverter para ordem cronológica
      const formattedMessages = messages.reverse().map(msg => ({
        id: msg.id,
        content: msg.content,
        messageType: msg.messageType,
        isRead: msg.isRead,
        readAt: msg.readAt,
        createdAt: msg.createdAt,
        isFromMe: msg.senderId === userId,
        sender: {
          id: msg.sender?.id,
          username: msg.sender?.username,
          pfp: msg.sender?.pfp
        }
      }));

      return res.json({ 
        messages: formattedMessages,
        hasMore: messages.length === parseInt(limit as string)
      });

    } catch (error) {
      console.error('Error getting messages:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Marcar mensagens como lidas
  static async markMessagesAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { conversationId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se o usuário pertence à conversa
      const conversation = await Conversation.findOne({
        where: {
          id: conversationId,
          [Op.or]: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        }
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversa não encontrada' });
      }

      // Marcar mensagens como lidas (apenas mensagens de outros usuários)
      const [updatedCount] = await Message.update(
        { 
          isRead: true,
          readAt: new Date()
        },
        {
          where: {
            conversationId: conversationId,
            senderId: { [Op.ne]: userId },
            isRead: false
          }
        }
      );

      return res.json({ 
        message: 'Mensagens marcadas como lidas',
        updatedCount 
      });

    } catch (error) {
      console.error('Error marking messages as read:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter contagem de mensagens não lidas
  static async getUnreadCount(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Buscar conversas do usuário
      const conversations = await Conversation.findAll({
        where: {
          [Op.or]: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        }
      });

      const conversationIds = conversations.map(conv => conv.id);

      // Contar mensagens não lidas
      const unreadCount = await Message.count({
        where: {
          conversationId: { [Op.in]: conversationIds },
          senderId: { [Op.ne]: userId },
          isRead: false
        }
      });

      return res.json({ unreadCount });

    } catch (error) {
      console.error('Error getting unread count:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}