"use client";
import { useState, useRef, useEffect } from "react";
import { useRecommendations } from "@/hooks/useRecommendations";

export default function MenuSwipe() {
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  
  // TODOS os hooks devem ser chamados ANTES de qualquer return condicional
  const { recommendations, loading, error, handleUserAction, fetchRecommendations } = useRecommendations();
  
  // UseEffect sempre no mesmo lugar
  useEffect(() => {
    // Log quando mudar de usuário
  }, [index]);

  // Reset dragOffset quando muda de usuário para evitar indicadores fantasma
  useEffect(() => {
    if (!isAnimating) {
      setDragOffset({ x: 0, y: 0 });
    }
  }, [index, isAnimating]);

  // Agora fazemos as verificações condicionais APÓS todos os hooks
  const recommendation = recommendations[index];

  // Verificar se temos recomendações
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Carregando recomendações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Erro ao carregar recomendações</p>
          <button 
            onClick={() => fetchRecommendations()}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!recommendation || index >= recommendations.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Acabaram as recomendações!</h2>
          <p className="text-foreground/60 mb-4">Volte mais tarde para ver novos perfis</p>
          <button 
            onClick={() => {
              setIndex(0);
              fetchRecommendations();
            }}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Buscar mais perfis
          </button>
        </div>
      </div>
    );
  }

  const handleSwipe = async (direction: "left" | "right") => {
    if (isAnimating || !recommendation) {
      return;
    }
    setIsAnimating(true);
    
    // Animar para fora da tela
    const targetX = direction === "right" ? 1000 : -1000;
    setDragOffset({ x: targetX, y: 0 });
    
    try {
      // Enviar ação para o backend
      await handleUserAction(recommendation.user.id, direction === "right" ? "like" : "pass");
    } catch (error) {
      console.error('Erro ao processar ação:', error);
    }
    
    setTimeout(() => {
      // Avançar para próximo usuário e resetar dragOffset ao mesmo tempo
      setIndex(prevIndex => {
        return prevIndex + 1;
      });
      // Reset imediato do dragOffset para evitar indicadores fantasma
      setDragOffset({ x: 0, y: 0 });
      setIsAnimating(false);
    }, 300);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAnimating) return;
    e.preventDefault();
    
    const startX = e.clientX;
    const startY = e.clientY;
    let currentDragOffset = { x: 0, y: 0 };
    
    setIsDragging(true);
    
    // Adicionar event listeners ao document para capturar movimento fora do card
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      currentDragOffset = { x: deltaX, y: deltaY * 0.1 };
      setDragOffset(currentDragOffset);
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      
      // Usar o valor atual do drag para decidir
      const threshold = 80;
      const velocity = Math.abs(currentDragOffset.x);
      
      if (velocity > threshold) {
        const direction = currentDragOffset.x > 0 ? "right" : "left";
        handleSwipe(direction);
      } else {
        setDragOffset({ x: 0, y: 0 });
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    setIsDragging(true);
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startPos.current.x;
    const deltaY = touch.clientY - startPos.current.y;
    setDragOffset({ x: deltaX, y: deltaY * 0.1 });
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    handleDragEnd();
  };

  const handleDragEnd = () => {
    const threshold = 80;
    const velocity = Math.abs(dragOffset.x);
    
    if (velocity > threshold) {
      const direction = dragOffset.x > 0 ? "right" : "left";
      handleSwipe(direction);
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  if (!recommendation) return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Acabaram os perfis!</h2>
        <p className="text-foreground/70">Volte mais tarde para ver novos gamers</p>
        <button 
          onClick={() => setIndex(0)} 
          className="mt-4 bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-full transition-colors shadow-lg"
        >
          Recomeçar
        </button>
      </div>
    </div>
  );

  const user = recommendation.user;
  const rotation = dragOffset.x * 0.05; // Reduzida para ser mais sutil
  const opacity = 1 - Math.abs(dragOffset.x) / 400;
  const scale = isDragging ? 0.95 : 1;

  // Função para determinar a cor do badge de compatibilidade
  const getCompatibilityBadge = (compatibility: string, percentage: number) => {
    const configs = {
      perfect: { color: 'bg-emerald-500', text: '✨ PERFEITO', icon: '💖' },
      high: { color: 'bg-green-500', text: 'ALTA', icon: '💚' },
      good: { color: 'bg-blue-500', text: 'BOA', icon: '💙' },
      medium: { color: 'bg-yellow-500', text: 'MÉDIA', icon: '💛' },
      low: { color: 'bg-gray-500', text: 'BAIXA', icon: '🤍' }
    };
    
    const config = configs[compatibility as keyof typeof configs] || configs.low;
    
    return (
      <div className={`${config.color} text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg`}>
        <span>{config.icon}</span>
        <span>{config.text} - {percentage}%</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="relative w-full max-w-sm">
        <div 
          ref={cardRef}
          className={`relative bg-card/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-card-border ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isAnimating ? 'transition-all duration-300 ease-out' : ''}`}
          style={{
            transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg) scale(${scale})`,
            opacity: opacity,
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'none',
          } as React.CSSProperties}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDragStart={(e) => e.preventDefault()} // Previne drag nativo
        >
          {/* Card content */}
          <div className="relative">
            <div className="h-64 md:h-80 bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center text-6xl md:text-8xl border-4 border-primary/20 shadow-xl">
                {user.pfp ? (
                  <img 
                    src={user.pfp} 
                    alt={user.username} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  '🎮'
                )}
              </div>

              {/* Badge de compatibilidade */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                {getCompatibilityBadge(recommendation.compatibility, recommendation.percentage)}
              </div>
            </div>
            
            {/* Swipe indicators - mais responsivos */}
            <div 
              className={`absolute top-8 left-8 bg-green-600 text-white px-6 py-3 rounded-full font-bold transform rotate-12 transition-all duration-200 shadow-lg ${!isAnimating && dragOffset.x > 50 ? 'opacity-100 scale-110' : 'opacity-0 scale-90'}`}
            >
              LIKE ❤️
            </div>
            <div 
              className={`absolute top-8 right-8 bg-red-600 text-white px-6 py-3 rounded-full font-bold transform -rotate-12 transition-all duration-200 shadow-lg ${!isAnimating && dragOffset.x < -50 ? 'opacity-100 scale-110' : 'opacity-0 scale-90'}`}
            >
              NOPE ✖️
            </div>
          </div>
          
          <div className="p-6 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">{user.username}, {user.age}</h2>
              {user.is_admin && (
                <span className="bg-purple-500/20 text-purple-600 px-2 py-1 rounded-full text-xs border border-purple-500/30">
                  ⭐ ADMIN
                </span>
              )}
            </div>

            <p className="text-foreground/70 mb-4 text-sm md:text-base">{user.bio || "Sem biografia"}</p>
            
            {/* Nicknames */}
            {user.nicknames && user.nicknames.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground/90 mb-2">Apelidos:</h3>
                <div className="flex flex-wrap gap-2">
                  {user.nicknames.map((nickname, idx) => (
                    <span key={idx} className="bg-purple-500/20 text-purple-600 px-3 py-1 rounded-full text-xs md:text-sm border border-purple-500/30">
                      @{nickname}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Jogos em comum */}
            {recommendation.matches.games.common.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground/90 mb-2">
                  🎮 Jogos em comum ({recommendation.matches.games.count}/{recommendation.matches.games.total}):
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recommendation.matches.games.common.map((game, idx) => (
                    <span key={idx} className="bg-green-500/20 text-green-600 px-3 py-1 rounded-full text-xs md:text-sm border border-green-500/30">
                      {game.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Interesses em comum */}
            {recommendation.matches.interests.common.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground/90 mb-2">
                  💫 Interesses em comum ({recommendation.matches.interests.count}/{recommendation.matches.interests.total}):
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recommendation.matches.interests.common.map((interest, idx) => (
                    <span key={idx} className="bg-blue-500/20 text-blue-600 px-3 py-1 rounded-full text-xs md:text-sm border border-blue-500/30">
                      {interest.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Score detalhado */}
            <div className="bg-card/30 rounded-lg p-3 mt-4">
              <h3 className="text-sm font-semibold text-foreground/90 mb-2">📊 Pontuação de Compatibilidade:</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-foreground/70">Jogos:</span>
                  <span className="font-semibold text-green-600">{recommendation.gameScore} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Interesses:</span>
                  <span className="font-semibold text-blue-600">{recommendation.interestScore} pts</span>
                </div>
                <div className="flex justify-between border-t border-card-border pt-2">
                  <span className="text-foreground font-semibold">Total:</span>
                  <span className="font-bold text-primary">{recommendation.totalScore} pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-center gap-6 mt-6">
          <button 
            onClick={() => handleSwipe("left")} 
            className="bg-red-600 hover:bg-red-700 text-white rounded-full w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-2xl md:text-3xl shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 border border-red-500/30"
            disabled={isAnimating}
          >
            ✖
          </button>
          <button 
            onClick={() => handleSwipe("right")} 
            className="bg-green-600 hover:bg-green-700 text-white rounded-full w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-2xl md:text-3xl shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 border border-green-500/30"
            disabled={isAnimating}
          >
            ❤
          </button>
        </div>
      </div>
    </div>
  );
}
