'use client';

import { useState, useCallback } from 'react';
import useAuth from './useAuth';
import { Conversation, Message } from './useSocket';

export const useChat = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    if (!token) {
      throw new Error('Token não encontrado');
    }

    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/chat${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro na requisição');
      }

      const data = await response.json();
      return data;
      
    } catch (error) {
      throw error;
    }
  };

  const getConversations = useCallback(async (): Promise<Conversation[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall('/conversations');
      return response.conversations;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar conversas';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const getOrCreateConversation = useCallback(async (targetUserId: number): Promise<{
    conversation: {
      id: number;
      chatPartner: {
        id: number;
        username: string;
        pfp?: string;
      };
      createdAt: string;
    }
  }> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall(`/conversations/${targetUserId}`);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar conversa';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const getMessages = useCallback(async (conversationId: number, page: number = 1, limit: number = 50): Promise<{
    messages: Message[];
    hasMore: boolean;
  }> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall(`/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar mensagens';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const markMessagesAsRead = useCallback(async (conversationId: number): Promise<void> => {
    try {
      setError(null);
      await apiCall(`/conversations/${conversationId}/read`, {
        method: 'PUT'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao marcar mensagens como lidas';
      setError(errorMessage);
      throw err;
    }
  }, [token]);

  const getUnreadCount = useCallback(async (): Promise<number> => {
    try {
      setError(null);
      const response = await apiCall('/conversations/unread-count');
      return response.unreadCount;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar contagem de não lidas';
      setError(errorMessage);
      throw err;
    }
  }, [token]);

  return {
    loading,
    error,
    getConversations,
    getOrCreateConversation,
    getMessages,
    markMessagesAsRead,
    getUnreadCount
  };
};