"use client";
import { useState, useEffect, useRef } from "react";

const mockNotifications = [
  { id: 1, text: "Ana curtiu seu perfil!", time: "2 min", read: false },
  { id: 2, text: "Novo match com Lucas!", time: "1h", read: false },
  { id: 3, text: "Marina enviou uma mensagem", time: "3h", read: true },
];

interface HeaderProps {
  onLogoClick?: () => void;
}

export default function Header({ onLogoClick }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const unreadCount = mockNotifications.filter(n => !n.read).length;

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
              <div className="absolute right-0 top-12 w-72 bg-card border border-card-border rounded-lg shadow-2xl max-h-80 overflow-y-auto z-10">
                <div className="p-3 border-b border-card-border bg-card">
                  <h3 className="font-semibold text-foreground">Notificações</h3>
                </div>
                {mockNotifications.map(notif => (
                  <div key={notif.id} className={`p-3 border-b border-card-border hover:bg-primary/5 transition-colors bg-card ${!notif.read ? 'bg-primary/10' : ''}`}>
                    <p className="text-sm text-foreground">{notif.text}</p>
                    <p className="text-xs text-foreground/60 mt-1">{notif.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}