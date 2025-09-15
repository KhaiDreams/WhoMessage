'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import useAuth from './useAuth';

export interface Message {
  id: number;
  content: string;
  messageType: 'text' | 'image' | 'file';
  isRead: boolean;
  createdAt: string;
  isFromMe: boolean;
  sender: {
    id: number;
    username: string;
    pfp?: string;
  };
}

export interface Conversation {
  id: number;
  chatPartner: {
    id: number;
    username: string;
    pfp?: string;
  };
  lastMessage?: {
    id: number;
    content: string;
    messageType: string;
    senderId: number;
    isFromMe: boolean;
    createdAt: string;
  };
  updatedAt: string;
}

export interface TypingUser {
  userId: number;
  username: string;
  conversationId: number;
}

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  
  const { user, token } = useAuth();
  const currentConversationId = useRef<number | null>(null);

  useEffect(() => {
    if (!token || !user) {
      return;
    }
    
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080', {
      auth: {
        token: token
      }
    });

    newSocket.on('connect', () => {
      setConnected(true);
      // Buscar conversas iniciais
      newSocket.emit('get_conversations');
    });

    newSocket.on('connect_error', (error) => {
      console.warn('Socket connection error (iOS safe):', error);
      setConnected(false);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    // Eventos de usuários online
    newSocket.on('user_online', (userId: number) => {
      setOnlineUsers(prev => [...prev.filter(id => id !== userId), userId]);
    });

    newSocket.on('user_offline', (userId: number) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    newSocket.on('online_users', (users: number[]) => {
      setOnlineUsers(users);
    });

    // Listener para receber conversas
    newSocket.on('conversations_list', (conversations: any[]) => {
      const formattedConversations: Conversation[] = conversations.map(conv => ({
        id: conv.id,
        chatPartner: {
          id: conv.otherUser.id,
          username: conv.otherUser.username,
          pfp: conv.otherUser.pfp
        },
        lastMessage: conv.lastMessage ? {
          id: conv.lastMessage.id,
          content: conv.lastMessage.content,
          messageType: conv.lastMessage.messageType,
          senderId: conv.lastMessage.senderId,
          isFromMe: conv.lastMessage.senderId === user.id,
          createdAt: conv.lastMessage.createdAt
        } : undefined,
        updatedAt: conv.updatedAt
      }));
      setConversations(formattedConversations);
    });

    newSocket.on('new_message', (message: any) => {
      try {
        const formattedMessage: Message = {
          id: message.id,
          content: message.content,
          messageType: message.messageType,
          isRead: message.isRead,
          createdAt: message.createdAt,
          isFromMe: message.sender.id === user.id,
          sender: message.sender
        };

        // Se é a conversa atual, adicionar às mensagens
        if (message.conversationId === currentConversationId.current) {
          setMessages(prev => [...prev.slice(-99), formattedMessage]); // Keep only last 100 messages
          
          // Se não é própria mensagem, marcar como lida automaticamente
          if (!formattedMessage.isFromMe) {
            newSocket.emit('mark_as_read', {
              conversationId: message.conversationId,
              messageId: message.id
            });
          }
        } else {
          // Atualizar contador de não lidas
          setUnreadCount(prev => prev + 1);
        }

        // Atualizar lista de conversas
        updateConversationLastMessage(message.conversationId, formattedMessage);
      } catch (error) {
        console.warn('Error processing new message:', error);
      }
    });

    newSocket.on('user_typing', (data: TypingUser) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(t => t.conversationId !== data.conversationId);
        return [...filtered, data];
      });
    });

    newSocket.on('user_stopped_typing', (data: { userId: number; conversationId: number }) => {
      setTypingUsers(prev => prev.filter(t => 
        !(t.conversationId === data.conversationId && t.userId === data.userId)
      ));
    });

    newSocket.on('messages_read', (data: {
      conversationId: number;
      readBy: number;
      messageId?: number;
    }) => {
      try {
        // Atualizar status de leitura das mensagens
        if (data.conversationId === currentConversationId.current) {
          setMessages(prev => prev.map(msg => ({
            ...msg,
            isRead: data.messageId ? (msg.id === data.messageId ? true : msg.isRead) : true
          })));
        }
      } catch (error) {
        console.warn('Error updating message read status:', error);
      }
    });

    newSocket.on('error', (error: { message: string }) => {
      console.warn('Socket error (iOS safe):', error.message);
    });

    setSocket(newSocket);

    return () => {
      try {
        newSocket.close();
      } catch (error) {
        console.warn('Error closing socket:', error);
      }
    };
  }, [token, user]);

  const updateConversationLastMessage = (conversationId: number, message: Message) => {
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === conversationId) {
          const updatedConv = {
            ...conv,
            lastMessage: {
              id: message.id,
              content: message.content,
              messageType: message.messageType,
              senderId: message.sender.id,
              isFromMe: message.isFromMe,
              createdAt: message.createdAt
            },
            updatedAt: message.createdAt
          };
          return updatedConv;
        }
        return conv;
      });
      
      return updated;
    });
  };

  const joinConversation = (conversationId: number) => {
    if (socket) {
      currentConversationId.current = conversationId;
      socket.emit('join_conversation', conversationId);
      
      // Força uma atualização das conversas para garantir dados atualizados
      socket.emit('get_conversations');
    }
  };

  const leaveConversation = (conversationId: number) => {
    if (socket) {
      socket.emit('leave_conversation', conversationId);
      if (currentConversationId.current === conversationId) {
        currentConversationId.current = null;
      }
    }
  };

  const sendMessage = (conversationId: number, content: string, messageType: 'text' | 'image' | 'file' = 'text') => {
    try {
      if (socket && connected) {
        socket.emit('send_message', {
          conversationId,
          content,
          messageType
        });
      }
    } catch (error) {
      console.warn('Error sending message:', error);
    }
  };

  const startTyping = (conversationId: number) => {
    try {
      if (socket && connected) {
        socket.emit('typing_start', { conversationId });
      }
    } catch (error) {
      console.warn('Error starting typing:', error);
    }
  };

  const stopTyping = (conversationId: number) => {
    try {
      if (socket && connected) {
        socket.emit('typing_stop', { conversationId });
      }
    } catch (error) {
      console.warn('Error stopping typing:', error);
    }
  };

  const markAsRead = (conversationId: number, messageId?: number) => {
    try {
      if (socket && connected) {
        socket.emit('mark_as_read', { conversationId, messageId });
      }
    } catch (error) {
      console.warn('Error marking as read:', error);
    }
  };

  const isUserOnline = (userId: number) => {
    return onlineUsers.includes(userId);
  };

  return {
    socket,
    connected,
    messages,
    setMessages,
    conversations,
    setConversations,
    typingUsers,
    unreadCount,
    setUnreadCount,
    onlineUsers,
    isUserOnline,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead
  };
};