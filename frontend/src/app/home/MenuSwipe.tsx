"use client";
import { useState, useRef, useEffect } from "react";
import { mockUsers } from "@/lib/mockData";

export default function MenuSwipe() {
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  
  const user = mockUsers[index];

  useEffect(() => {
  }, [index, user?.name]);

  // Reset dragOffset quando muda de usuário para evitar indicadores fantasma
  useEffect(() => {
    if (!isAnimating) {
      setDragOffset({ x: 0, y: 0 });
    }
  }, [index, isAnimating]);

  const handleSwipe = (direction: "left" | "right") => {
    if (isAnimating) {
      return;
    }
    setIsAnimating(true);
    
    // Animar para fora da tela
    const targetX = direction === "right" ? 1000 : -1000;
    setDragOffset({ x: targetX, y: 0 });
    
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

  // Limpar event listeners quando componente desmonta
  useEffect(() => {
    return () => {
      // Cleanup será feito automaticamente pelos event listeners locais
    };
  }, []);

  if (!user) return (
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

  const rotation = dragOffset.x * 0.05; // Reduzida para ser mais sutil
  const opacity = 1 - Math.abs(dragOffset.x) / 400;
  const scale = isDragging ? 0.95 : 1;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 overflow-x-hidden">
      <div className="relative w-full max-w-sm overflow-x-hidden">
        <div 
          ref={cardRef}
          className={`relative bg-card/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden select-none border border-card-border ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isAnimating ? 'transition-all duration-300 ease-out' : ''}`}
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
            <div className="h-64 md:h-80 bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center text-6xl md:text-8xl border-4 border-primary/20 shadow-xl">
                🎮
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
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{user.name}, {user.age}</h2>
            <p className="text-foreground/70 mb-4 text-sm md:text-base">{user.bio}</p>
            
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground/90 mb-2">Jogos favoritos:</h3>
              <div className="flex flex-wrap gap-2">
                {user.tags.map(tag => (
                  <span key={tag} className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs md:text-sm border border-primary/30">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground/90 mb-2">Interesses:</h3>
              <div className="flex flex-wrap gap-2">
                {user.interests.map(interest => (
                  <span key={interest} className="bg-accent/20 text-accent px-3 py-1 rounded-full text-xs md:text-sm border border-accent/30">
                    {interest}
                  </span>
                ))}
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
        
        {/* Progress indicator */}
        <div className="mt-4 text-center text-foreground/60 text-sm">
          {index + 1} de {mockUsers.length}
        </div>
      </div>
    </div>
  );
}
