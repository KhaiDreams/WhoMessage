"use client";
import { useState, useEffect, useRef } from "react";
import useNotifications from "@/hooks/useNotifications";
import { interactionsAPI } from "@/lib/api";
import { toast } from "react-toastify";
import AdminButton from "./AdminButton";
import UserProfile from "@/components/UserProfile";
import { Bell, Heart, Trash2 } from 'lucide-react';

interface HeaderProps {
  onLogoClick?: () => void;
  onNavigateToMessages?: () => void;
}

export default function Header({ onLogoClick, onNavigateToMessages }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [likingBack, setLikingBack] = useState<number | null>(null);
  const [resolvedLikeNotifications, setResolvedLikeNotifications] = useState<Set<number>>(new Set());
  const [viewingProfileUserId, setViewingProfileUserId] = useState<number | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, loading } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleNotifClick = async (notif: typeof notifications[number]) => {
    if (!notif.read) markAsRead(notif.id);
    if (notif.type === 'like_received' && notif.from_user_id) {
      setShowNotifications(false);
      setViewingProfileUserId(notif.from_user_id);
    } else if (notif.type === 'new_message' || notif.type === 'match_created') {
      setShowNotifications(false);
      onNavigateToMessages?.();
    }
  };

  const handleLikeBack = async (e: React.MouseEvent, fromUserId: number, notifId: number) => {
    e.stopPropagation();

    if (resolvedLikeNotifications.has(notifId)) {
      return;
    }

    setLikingBack(notifId);
    try {
      const result: any = await interactionsAPI.likeUser(fromUserId, 'like');
      setResolvedLikeNotifications(prev => {
        const next = new Set(prev);
        next.add(notifId);
        return next;
      });
      await markAsRead(notifId);

      if (result.match) {
        toast.success('É um match! 🎉 Agora vocês podem conversar.');
        onNavigateToMessages?.();
        setShowNotifications(false);
      } else {
        toast.success('Like enviado! 💖');
      }
    } catch {
      // erro já tratado por apiFetch
    } finally {
      setLikingBack(null);
    }
  };

  const handleClearAll = async () => {
    const ok = await clearAll();
    if (ok) toast.success('Notificações limpas!');
  };

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-card-border px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <img src="/assets/logo-removebg-preview.png" alt="WhoMessage" className="h-8 w-auto" />
          <span className="font-bold text-primary text-lg hidden sm:block">WhoMessage</span>
        </button>

        <div className="flex items-center gap-3">
          <AdminButton />
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-foreground/70 hover:text-primary transition-colors rounded-full hover:bg-primary/10"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-card border border-card-border rounded-lg shadow-2xl z-10 flex flex-col max-h-[80vh]">
                {/* Header do painel */}
                <div className="p-3 border-b border-card-border bg-card flex justify-between items-center flex-shrink-0">
                  <h3 className="font-semibold text-foreground">Notificações</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>
                </div>

                {/* Lista */}
                <div className="overflow-y-auto flex-1">
                  {loading ? (
                    <div className="p-4 text-center text-foreground/60">Carregando...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-foreground/60">Nenhuma notificação</div>
                  ) : (
                    notifications.slice(0, 15).map(notif => (
                      <div
                        key={notif.id}
                        className={`p-3 border-b border-card-border transition-colors cursor-pointer hover:bg-primary/5 ${!notif.read ? 'bg-primary/10' : 'bg-card'}`}
                        onClick={() => handleNotifClick(notif)}
                      >
                        <div className="flex items-start gap-2">
                          {notif.fromUser?.pfp ? (
                            <img
                              src={notif.fromUser.pfp}
                              alt={notif.fromUser.username}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-primary">
                                {notif.fromUser?.username?.[0]?.toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{notif.title}</p>
                            <p className="text-xs text-foreground/70 mt-0.5">{notif.message}</p>
                            <p className="text-xs text-foreground/50 mt-0.5">
                              {new Date(notif.created_at).toLocaleString('pt-BR', {
                                hour: '2-digit', minute: '2-digit',
                                day: '2-digit', month: '2-digit'
                              })}
                            </p>
                            {/* Botão "Curtir de volta" para likes recebidos */}
                            {notif.type === 'like_received' &&
                              notif.from_user_id &&
                              !notif.read &&
                              notif.canLikeBack !== false &&
                              !resolvedLikeNotifications.has(notif.id) && (
                              <button
                                onClick={(e) => handleLikeBack(e, notif.from_user_id!, notif.id)}
                                disabled={likingBack === notif.id}
                                className="mt-2 flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs px-3 py-1 rounded-full transition-colors"
                              >
                                <Heart className="w-3 h-3" />
                                {likingBack === notif.id ? 'Enviando...' : 'Curtir de volta'}
                              </button>
                            )}
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer: limpar notificações */}
                {notifications.length > 0 && (
                  <div className="p-2 border-t border-card-border flex-shrink-0">
                    <button
                      onClick={handleClearAll}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-foreground/50 hover:text-red-500 transition-colors py-1.5 rounded hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Limpar notificações
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>

    {/* Modal de perfil aberto via notificação de like */}
    {viewingProfileUserId && (
      <UserProfile
        userId={viewingProfileUserId}
        onClose={() => setViewingProfileUserId(null)}
      />
    )}
    </>
  );
}
