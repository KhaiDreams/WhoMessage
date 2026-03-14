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

  // Limpar todas as notificações (apaga do banco)
  const clearAll = useCallback(async () => {
    try {
      await notificationsAPI.clearAll();
      setNotifications([]);
      setUnreadCount(0);
      return true;
    } catch (err: any) {
      console.error('Erro ao limpar notificações:', err);
      return false;
    }
  }, []);

  // Polling — pausa quando aba está oculta, retoma no foco
  useEffect(() => {
    fetchNotifications();

    const INTERVAL_MS = 60_000; // 60s — notificações não são ultra-urgentes
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => fetchNotifications(), INTERVAL_MS);
    };
    const stop = () => {
      if (timer) { clearInterval(timer); timer = null; }
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        fetchNotifications(); // busca imediata ao retornar
        start();
      }
    };

    start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
    refresh: fetchNotifications,
  };
};

export default useNotifications;
