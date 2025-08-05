// hooks/useNotifications.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { notificationsAPI, Notification } from '@/lib/api';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar notificações
  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationsAPI.getNotifications(page, limit);
      
      if (page === 1) {
        setNotifications(response.notifications);
      } else {
        setNotifications(prev => [...prev, ...response.notifications]);
      }
      
      setUnreadCount(response.unreadCount);
      return response;
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar notificações');
      console.error('Erro ao buscar notificações:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Marcar como lida
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      return true;
    } catch (err: any) {
      console.error('Erro ao marcar notificação como lida:', err);
      return false;
    }
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllAsRead();
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      
      setUnreadCount(0);
      return true;
    } catch (err: any) {
      console.error('Erro ao marcar todas as notificações como lidas:', err);
      return false;
    }
  }, []);

  // Polling para buscar novas notificações
  useEffect(() => {
    fetchNotifications();
    
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
};

export default useNotifications;
