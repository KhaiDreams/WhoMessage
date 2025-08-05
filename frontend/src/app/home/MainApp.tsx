"use client";
import { useState, useEffect } from "react";
import MenuSwipe from "./MenuSwipe";
import Messages from "./Messages";
import Profile from "./Profile";
import Header from "./Header";
import Welcome from "./Welcome";
import useProfile from "@/hooks/useProfile";

const tabs = [
  { key: "menu", label: "Menu", icon: "🏠" },
  { key: "messages", label: "Mensagens", icon: "💬" },
  { key: "profile", label: "Perfil", icon: "👤" },
];

export default function MainApp() {
  const [tab, setTab] = useState("menu");
  const [showWelcome, setShowWelcome] = useState(true);
  const { isAuthenticated } = useProfile();

  // Verificar autenticação
  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }
  }, [isAuthenticated]);

  // Simular verificação se é primeira vez do usuário
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('whomessage_tutorial_completed');
    if (hasSeenWelcome === 'true') {
      setShowWelcome(false);
    }
  }, []);

  const handleWelcomeComplete = () => {
    localStorage.setItem('whomessage_tutorial_completed', 'true');
    setShowWelcome(false);
  };

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Redirecionando...</p>
        </div>
      </div>
    );
  }

  if (showWelcome) {
    return <Welcome onComplete={handleWelcomeComplete} />;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary/10 to-secondary/10 overflow-x-hidden">
      <Header onLogoClick={() => setTab("menu")} />
      <div className="pt-16 pb-16 min-h-screen overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 h-full">
          {tab === "menu" && <MenuSwipe />}
          {tab === "messages" && <Messages />}
          {tab === "profile" && <Profile />}
        </div>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-card-border shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-around items-center h-16 px-4">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`flex flex-col items-center flex-1 max-w-[100px] py-2 transition-colors ${
                tab === t.key 
                  ? 'text-primary font-bold' 
                  : 'text-foreground/60 hover:text-foreground/80'
              }`}
              onClick={() => setTab(t.key)}
            >
              <span className="text-2xl mb-1">{t.icon}</span>
              <span className="text-xs">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
