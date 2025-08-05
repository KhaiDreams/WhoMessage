"use client";
import { useState, useEffect, useRef } from "react";
import useNotifications from "@/hooks/useNotifications";

interface HeaderProps {
  onLogoClick?: () => void;
}

export default function Header({ onLogoClick }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();

  // Fechar notificações ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  return (
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
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-foreground/70 hover:text-primary transition-colors rounded-full hover:bg-primary/10"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-card border border-card-border rounded-lg shadow-2xl max-h-96 overflow-y-auto z-10">
                <div className="p-3 border-b border-card-border bg-card flex justify-between items-center">
                  <h3 className="font-semibold text-foreground">Notificações</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                
                {loading ? (
                  <div className="p-4 text-center text-foreground/60">
                    Carregando...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-foreground/60">
                    Nenhuma notificação
                  </div>
                ) : (
                  notifications.slice(0, 10).map(notif => (
                    <div 
                      key={notif.id} 
                      className={`p-3 border-b border-card-border hover:bg-primary/5 transition-colors cursor-pointer ${
                        !notif.read ? 'bg-primary/10' : 'bg-card'
                      }`}
                      onClick={() => !notif.read && markAsRead(notif.id)}
                    >
                      <div className="flex items-start gap-2">
                        {notif.fromUser?.pfp ? (
                          <img 
                            src={notif.fromUser.pfp} 
                            alt={notif.fromUser.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                              {notif.fromUser?.username?.[0] || '?'}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{notif.title}</p>
                          <p className="text-xs text-foreground/70 mt-1">{notif.message}</p>
                          <p className="text-xs text-foreground/50 mt-1">
                            {new Date(notif.created_at).toLocaleString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                
                {notifications.length > 10 && (
                  <div className="p-3 text-center border-t border-card-border">
                    <button className="text-xs text-primary hover:text-primary/80 transition-colors">
                      Ver todas as notificações
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}