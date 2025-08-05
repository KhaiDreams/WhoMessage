"use client";
import { useState } from "react";
import { useMatches } from "@/hooks/useMatches";
import UserProfile from "@/components/UserProfile";

export default function Messages() {
  const { matches, loading, error, fetchMatches } = useMatches();
  const [selected, setSelected] = useState<number | null>(null);
  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  
  const selectedMatch = matches.find(m => m.id === selected);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Carregando seus matches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Erro ao carregar matches</p>
          <button 
            onClick={() => fetchMatches()}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">�</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Nenhum match ainda</h2>
          <p className="text-foreground/60 mb-4">Continue usando o swipe para encontrar alguém especial!</p>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-foreground/80">
              💡 <strong>Dica:</strong> Quando vocês se curtirem mutuamente, aparecerá um match aqui e poderão conversar!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full max-w-6xl mx-auto p-2 md:p-0">
      {/* Profile Modal */}
      {profileUserId && (
        <UserProfile 
          userId={profileUserId} 
          onClose={() => setProfileUserId(null)} 
        />
      )}
      
      <div className="flex h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] bg-card/80 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden border border-card-border">
        {/* Lista de conversas */}
        <div className={`w-full md:w-1/3 border-r border-card-border overflow-y-auto ${selected ? 'hidden md:block' : 'block'}`}>
          <div className="p-3 md:p-4 border-b border-card-border bg-card/90">
            <h2 className="text-lg md:text-xl font-bold text-foreground">Matches ({matches.length})</h2>
          </div>
          {matches.map(match => (
            <div
              key={match.id}
              className={`flex items-center gap-3 p-3 md:p-4 cursor-pointer hover:bg-primary/10 transition-colors ${selected === match.id ? 'bg-primary/20 border-r-2 border-primary' : ''}`}
              onClick={() => setSelected(match.id)}
            >
              <div 
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center text-lg md:text-xl border border-primary/20 cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileUserId(match.otherUser.id);
                }}
                title={`Ver perfil de ${match.otherUser.username}`}
              >
                {match.otherUser.pfp ? (
                  <img 
                    src={match.otherUser.pfp} 
                    alt={match.otherUser.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  '🎮'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div 
                  className="font-semibold text-foreground hover:text-primary cursor-pointer transition-colors text-sm md:text-base truncate"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileUserId(match.otherUser.id);
                  }}
                  title={`Ver perfil de ${match.otherUser.username}`}
                >
                  {match.otherUser.username}
                </div>
                <div className="text-xs md:text-sm text-foreground/60 truncate">
                  Match em {new Date(match.matched_at).toLocaleDateString('pt-BR')}
                </div>
                <div className="text-xs text-green-400 mt-1">
                  {match.chat_active ? 'Chat ativo' : 'Chat pausado'}
                </div>
              </div>
              {/* Seta para indicar que pode abrir no mobile */}
              <div className="md:hidden text-foreground/40">
                →
              </div>
            </div>
          ))}
        </div>
        
        {/* Chat - Responsivo para mobile */}
        <div className={`flex-1 flex-col justify-between bg-card/60 ${selected ? 'flex' : 'hidden md:flex'}`}>
          {selected && selectedMatch ? (
            <>
              <div className="p-3 md:p-4 border-b border-card-border bg-card/90 flex items-center gap-3">
                <button 
                  onClick={() => setSelected(null)}
                  className="md:hidden text-primary hover:bg-primary/10 p-2 rounded-full transition-colors flex-shrink-0"
                  title="Voltar para lista"
                >
                  ←
                </button>
                <div 
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center border border-primary/20 cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
                  onClick={() => setProfileUserId(selectedMatch.otherUser.id)}
                  title={`Ver perfil de ${selectedMatch.otherUser.username}`}
                >
                  {selectedMatch.otherUser.pfp ? (
                    <img 
                      src={selectedMatch.otherUser.pfp} 
                      alt={selectedMatch.otherUser.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    '🎮'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div 
                    className="font-semibold text-foreground hover:text-primary cursor-pointer transition-colors text-sm md:text-base truncate"
                    onClick={() => setProfileUserId(selectedMatch.otherUser.id)}
                    title={`Ver perfil de ${selectedMatch.otherUser.username}`}
                  >
                    {selectedMatch.otherUser.username}
                  </div>
                  <div className="text-xs md:text-sm text-green-400">Match desde {new Date(selectedMatch.matched_at).toLocaleDateString('pt-BR')}</div>
                </div>
              </div>

              {/* Messages area - placeholder for now */}
              <div className="flex-1 p-3 md:p-4 overflow-y-auto">
                <div className="text-center py-4 md:py-8">
                  <div className="text-4xl md:text-6xl mb-2 md:mb-4">🚧</div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">Chat em desenvolvimento</h3>
                  <p className="text-sm md:text-base text-foreground/60 mb-3 md:mb-4">
                    Em breve você poderá conversar com {selectedMatch.otherUser.username}!
                  </p>
                  <div className="mt-3 md:mt-4 p-3 md:p-4 bg-primary/10 rounded-lg">
                    <p className="text-xs md:text-sm text-foreground/80">
                      <strong>Perfil:</strong> {selectedMatch.otherUser.bio || "Sem biografia"}
                    </p>
                    {selectedMatch.otherUser.age && (
                      <p className="text-xs md:text-sm text-foreground/80 mt-1">
                        <strong>Idade:</strong> {selectedMatch.otherUser.age} anos
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Message input - placeholder */}
              <div className="p-3 md:p-4 border-t border-card-border bg-card/90">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite sua mensagem..."
                    className="flex-1 p-2 md:p-3 text-sm md:text-base rounded-lg bg-muted border border-muted-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled
                  />
                  <button 
                    className="p-2 md:p-3 bg-primary/50 text-white rounded-lg hover:bg-primary/60 transition-colors disabled:opacity-50 flex-shrink-0"
                    disabled
                  >
                    📨
                  </button>
                </div>
                <p className="text-xs text-foreground/60 mt-2 text-center">
                  Sistema de chat será implementado em breve
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4 md:p-8">
              <div className="text-center">
                <div className="text-4xl md:text-6xl mb-2 md:mb-4">💬</div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">Selecione uma conversa</h3>
                <p className="text-sm md:text-base text-foreground/60">Escolha um match para começar a conversar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
