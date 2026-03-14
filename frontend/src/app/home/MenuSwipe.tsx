"use client";
import { useState, useRef, useEffect } from "react";
import { useRecommendations } from "../../hooks/useRecommendations";
import { reportsAPI } from "../../lib/api";
import { toast } from "react-toastify";
import { Gamepad2, Sparkles, HeartHandshake, X, Flag, Heart, Star, BarChart2, Layers } from 'lucide-react';

export default function MenuSwipe() {
  const [autoLoading, setAutoLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [triedAuto, setTriedAuto] = useState(false);
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Refs para drag sem re-render por frame
  const cardRef = useRef<HTMLDivElement>(null);
  const likeIndicatorRef = useRef<HTMLDivElement>(null);
  const nopeIndicatorRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dragXRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const gestureRef = useRef<'none' | 'horizontal' | 'vertical'>('none');
  const lastTouchYRef = useRef(0);
  
  const { recommendations, loading, error, handleUserAction, fetchRecommendations } = useRecommendations();

  // Reseta posição do card quando muda de perfil
  useEffect(() => {
    dragXRef.current = 0;
    applyTransform(0);
  }, [index]);


  // Definir recommendation após hooks
  const recommendation = recommendations[index];

  let content: React.ReactNode = null;
  if (loading) {
    content = (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Carregando recomendações...</p>
        </div>
      </div>
    );
  } else if (error) {
    content = (
      <div className="flex items-center justify-center h-full">
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
  } else if (finished || (!recommendation || index >= recommendations.length)) {
    content = (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="mb-4 flex justify-center"><Sparkles className="w-16 h-16 text-primary" /></div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Acabaram as pessoas por enquanto!</h2>
          <p className="text-foreground/60 mb-4">Não há mais perfis para recomendar no momento.</p>
          <button
            onClick={() => {
              setAutoLoading(true);
              setFinished(false);
              setTriedAuto(false);
              fetchRecommendations().then(() => {
                setIndex(0);
                setAutoLoading(false);
              });
            }}
            className="mt-4 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }


  // Efeito para buscar mais recomendações automaticamente ao chegar no fim (só uma vez)
  useEffect(() => {
    if (finished) return;
    if ((recommendations.length === 0 || index >= recommendations.length) && !loading && !error && !autoLoading && !triedAuto) {
      setAutoLoading(true);
      setTriedAuto(true);
      fetchRecommendations().then(() => {
        setIndex(0);
        setAutoLoading(false);
        // Se continuar vazio, marca como finalizado
        setTimeout(() => {
          if (recommendations.length === 0) setFinished(true);
        }, 100);
      });
    } else if ((recommendations.length === 0 || index >= recommendations.length) && triedAuto) {
      setFinished(true);
    }
  }, [index, recommendations.length, loading, error, fetchRecommendations, autoLoading, finished, triedAuto]);
  // Resetar finished e triedAuto se novas recomendações chegarem
  useEffect(() => {
    if (recommendations.length > 0 && finished) {
      setFinished(false);
      setTriedAuto(false);
    }
  }, [recommendations.length, finished]);

  // Aplica transform diretamente no DOM — zero re-render por frame
  const applyTransform = (x: number) => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = `translateX(${x}px) rotate(${x * 0.05}deg)`;
    el.style.opacity = String(Math.max(0.3, 1 - Math.abs(x) / 400));
    if (likeIndicatorRef.current) {
      likeIndicatorRef.current.style.opacity = x > 50 ? '1' : '0';
      likeIndicatorRef.current.style.transform = `rotate(12deg) scale(${x > 50 ? 1.1 : 0.9})`;
    }
    if (nopeIndicatorRef.current) {
      nopeIndicatorRef.current.style.opacity = x < -50 ? '1' : '0';
      nopeIndicatorRef.current.style.transform = `rotate(-12deg) scale(${x < -50 ? 1.1 : 0.9})`;
    }
  };

  const snapBack = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transition = 'transform 0.25s ease-out, opacity 0.25s ease-out';
    dragXRef.current = 0;
    applyTransform(0);
    setTimeout(() => { if (cardRef.current) cardRef.current.style.transition = ''; }, 250);
  };

  const handleSwipe = async (direction: "left" | "right") => {
    if (isAnimatingRef.current || !recommendation) return;
    isAnimatingRef.current = true;
    setIsAnimating(true);

    const el = cardRef.current;
    if (el) {
      el.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
      applyTransform(direction === 'right' ? 1000 : -1000);
    }

    try {
      await handleUserAction(recommendation.user.id, direction === "right" ? "like" : "pass");
    } catch (err) {
      console.error('Erro ao processar ação:', err);
    }

    setTimeout(() => {
      if (cardRef.current) cardRef.current.style.transition = '';
      dragXRef.current = 0;
      setIndex(prev => prev + 1);
      setIsAnimating(false);
      isAnimatingRef.current = false;
    }, 300);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAnimatingRef.current) return;
    e.preventDefault();
    const startX = e.clientX;

    const onMove = (ev: MouseEvent) => {
      dragXRef.current = ev.clientX - startX;
      applyTransform(dragXRef.current);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (Math.abs(dragXRef.current) > 80) {
        handleSwipe(dragXRef.current > 0 ? 'right' : 'left');
      } else {
        snapBack();
      }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // handleSwipeRef — permite que o listener nativo (useEffect abaixo) sempre
  // acesse a versão mais recente de handleSwipe sem fechar sobre estado stale.
  const handleSwipeRef = useRef<(dir: 'left' | 'right') => void>(() => {});
  handleSwipeRef.current = handleSwipe;

  // Touch events com listener NATIVO não-passivo — essencial para poder chamar
  // e.preventDefault() e evitar concorrência com o scroll nativo do browser.
  // onTouchMove do React é passivo por padrão e não pode bloquear o scroll.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const onStart = (e: TouchEvent) => {
      if (isAnimatingRef.current) return;
      gestureRef.current = 'none';
      const t = e.touches[0];
      startPos.current = { x: t.clientX, y: t.clientY };
      lastTouchYRef.current = t.clientY;
    };

    const onMove = (e: TouchEvent) => {
      if (isAnimatingRef.current) return;
      const t = e.touches[0];
      const dx = t.clientX - startPos.current.x;
      const dy = t.clientY - startPos.current.y;
      const moveDY = lastTouchYRef.current - t.clientY;
      lastTouchYRef.current = t.clientY;

      if (gestureRef.current === 'none') {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          gestureRef.current = Math.abs(dx) >= Math.abs(dy) ? 'horizontal' : 'vertical';
        }
        // Bloqueia qualquer default durante a fase de detecção
        e.preventDefault();
        return;
      }

      if (gestureRef.current === 'horizontal') {
        // Impede scroll nativo ao arrastar horizontalmente
        e.preventDefault();
        dragXRef.current = dx;
        applyTransform(dx);
      } else if (scrollContainerRef.current) {
        // Scroll vertical manual — preventDefault evita conflito com scroll nativo
        e.preventDefault();
        scrollContainerRef.current.scrollTop += moveDY;
      }
    };

    const onEnd = () => {
      if (gestureRef.current === 'horizontal') {
        if (Math.abs(dragXRef.current) > 80) {
          handleSwipeRef.current(dragXRef.current > 0 ? 'right' : 'left');
        } else {
          snapBack();
        }
      }
      gestureRef.current = 'none';
    };

    el.addEventListener('touchstart', onStart, { passive: false });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
    };
  }, []); // todos os valores usados são refs — sem risco de stale closure

  // Função para abrir modal de report
  const handleReportClick = () => {
    setShowReportModal(true);
    setReportReason('');
    setReportDescription('');
  };

  // Função para enviar report
  const handleSubmitReport = async () => {
    if (!recommendation || !reportReason.trim()) {
      toast.error('Selecione um motivo para o report.');
      return;
    }

    setIsSubmittingReport(true);
    try {
      await reportsAPI.createReport(
        recommendation.user.id, 
        reportReason, 
        reportDescription.trim() || undefined
      );
      toast.success('Report enviado com sucesso! Nossa equipe irá analisar.');
      setShowReportModal(false);
      setReportReason('');
      setReportDescription('');
    } catch (error: any) {
      console.error('Erro ao enviar report:', error);
      toast.error(error.message || 'Erro ao enviar report.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Função para fechar modal
  const handleCloseModal = () => {
    if (!isSubmittingReport) {
      setShowReportModal(false);
      setReportReason('');
      setReportDescription('');
    }
  };


  // Se não for loading, error ou fim das recomendações, renderiza o card normalmente
  if (content) return (
    <div className="flex flex-col items-center px-4 py-2" style={{ height: 'calc(100dvh - 128px)', overflow: 'hidden' }}>
      {content}
    </div>
  );

  const user = recommendation.user;

  const getCompatibilityBadge = (compatibility: string, percentage: number) => {
    const configs: Record<string, { color: string; text: string; Icon: React.ElementType }> = {
      perfect: { color: 'bg-emerald-500', text: 'PERFEITO',  Icon: Sparkles },
      high:    { color: 'bg-green-500',   text: 'ALTA',      Icon: HeartHandshake },
      good:    { color: 'bg-blue-500',    text: 'BOA',       Icon: Star },
      medium:  { color: 'bg-yellow-500',  text: 'MÉDIA',     Icon: Star },
      low:     { color: 'bg-gray-500',    text: 'BAIXA',     Icon: Star },
    };
    const cfg = configs[compatibility] ?? configs.low;
    const BadgeIcon = cfg.Icon;
    return (
      <div className={`${cfg.color} text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg`}>
        <BadgeIcon className="w-4 h-4" />
        <span>{cfg.text} - {percentage}%</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center px-4 py-2" style={{ height: 'calc(100dvh - 128px)', overflow: 'hidden' }}>
      <div className="relative w-full max-w-sm flex flex-col" style={{ height: '100%' }}>
        <div
          ref={cardRef}
          className="relative bg-card rounded-2xl shadow-2xl border border-card-border flex flex-col flex-1 min-h-0 cursor-grab active:cursor-grabbing"
          style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none', willChange: 'transform' } as React.CSSProperties}
          onMouseDown={handleMouseDown}
          onDragStart={(e) => e.preventDefault()}
        >
          {/* Foto — fixo no topo */}
          <div className="relative flex-shrink-0">
            <div className="h-48 sm:h-56 bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center relative rounded-t-2xl overflow-hidden">
              <div className="w-32 h-32 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center border-4 border-primary/20 shadow-xl overflow-hidden">
                {user.pfp ? (
                  <img src={user.pfp} alt={user.username} className="w-full h-full object-cover" draggable={false} loading="lazy" />
                ) : (
                  <Gamepad2 className="w-16 h-16 text-primary/60" />
                )}
              </div>

              <div className="absolute top-4 left-1/2 -translate-x-1/2">
                {getCompatibilityBadge(recommendation.compatibility, recommendation.percentage)}
              </div>
            </div>

            {/* Indicadores ref-driven — sem re-render */}
            <div
              ref={likeIndicatorRef}
              className="absolute top-8 left-8 bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 pointer-events-none"
              style={{ opacity: 0, transform: 'rotate(12deg) scale(0.9)', transition: 'opacity 0.1s, transform 0.1s' }}
            >
              LIKE <Heart className="w-4 h-4" />
            </div>
            <div
              ref={nopeIndicatorRef}
              className="absolute top-8 right-8 bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 pointer-events-none"
              style={{ opacity: 0, transform: 'rotate(-12deg) scale(0.9)', transition: 'opacity 0.1s, transform 0.1s' }}
            >
              NOPE <X className="w-4 h-4" />
            </div>
          </div>
          
          {/* Seção de informações — rolagem vertical interna */}
          <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain relative" style={{scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch'} as React.CSSProperties}>
          <div className="p-5 bg-card/50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">{user.username}, {user.age}</h2>
              {user.is_admin && (
                <span className="bg-purple-500/20 text-purple-600 px-2 py-1 rounded-full text-xs border border-purple-500/30 flex items-center gap-1">
                  <Star className="w-3 h-3" /> ADMIN
                </span>
              )}
            </div>

            <p className="text-foreground/70 mb-4 text-sm md:text-base">{user.bio || "Sem biografia"}</p>
            
            {/* Nicknames */}
            {user.nicknames && user.nicknames.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground/90 mb-2">Apelidos:</h3>
                <div className="flex flex-wrap gap-2">
                  {user.nicknames.map((nickname: string, idx: number) => (
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
                <h3 className="text-sm font-semibold text-foreground/90 mb-2 flex items-center gap-1">
                  <Gamepad2 className="w-4 h-4" /> Jogos em comum ({recommendation.matches.games.count}/{recommendation.matches.games.total}):
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recommendation.matches.games.common.map((game: { name: string }, idx: number) => (
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
                <h3 className="text-sm font-semibold text-foreground/90 mb-2 flex items-center gap-1">
                  <Layers className="w-4 h-4" /> Interesses em comum ({recommendation.matches.interests.count}/{recommendation.matches.interests.total}):
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recommendation.matches.interests.common.map((interest: { name: string }, idx: number) => (
                    <span key={idx} className="bg-blue-500/20 text-blue-600 px-3 py-1 rounded-full text-xs md:text-sm border border-blue-500/30">
                      {interest.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Score detalhado */}
            <div className="bg-card/30 rounded-lg p-3 mt-4">
              <h3 className="text-sm font-semibold text-foreground/90 mb-2 flex items-center gap-1"><BarChart2 className="w-4 h-4" /> Pontuação de Compatibilidade:</h3>
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
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-center gap-4 mt-3 flex-shrink-0 pb-2">
          <button 
            onClick={() => handleSwipe("left")} 
            className="bg-red-600 hover:bg-red-700 text-white rounded-full w-14 h-14 md:w-16 md:h-16 flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 border border-red-500/30"
            disabled={isAnimating}
          >
            <X className="w-7 h-7 md:w-8 md:h-8" />
          </button>
          
          {/* Botão de Report */}
          <button 
            onClick={handleReportClick}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-12 h-12 md:w-14 md:h-14 flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 border border-orange-500/30"
            disabled={isAnimating}
            title="Reportar usuário"
          >
            <Flag className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          
          <button 
            onClick={() => handleSwipe("right")} 
            className="bg-green-600 hover:bg-green-700 text-white rounded-full w-14 h-14 md:w-16 md:h-16 flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 border border-green-500/30"
            disabled={isAnimating}
          >
            <Heart className="w-7 h-7 md:w-8 md:h-8" />
          </button>
        </div>
      </div>

      {/* Modal de Report */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl border border-card-border max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground">
                  Reportar {recommendation?.user.username}
                </h3>
                <button 
                  onClick={handleCloseModal}
                  className="text-foreground/60 hover:text-foreground text-2xl flex items-center justify-center"
                  disabled={isSubmittingReport}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-foreground/70 mb-4 text-sm">
                Selecione o motivo do report. Nossa equipe irá analisar.
              </p>

              {/* Motivos de report */}
              <div className="space-y-3 mb-4">
                <div className="text-sm font-semibold text-foreground/90 mb-2">Motivo:</div>
                {[
                  'Conteúdo ofensivo ou inadequado',
                  'Perfil falso ou enganoso',
                  'Comportamento suspeito',
                  'Spam ou golpe',
                  'Assédio ou intimidação',
                  'Conteúdo sexual impróprio',
                  'Discurso de ódio',
                  'Outro'
                ].map((reason) => (
                  <label key={reason} className="flex items-center gap-3">
                    <input 
                      type="radio"
                      name="report-reason"
                      value={reason}
                      checked={reportReason === reason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="text-primary focus:ring-primary"
                      disabled={isSubmittingReport}
                    />
                    <span className="text-sm text-foreground/80">{reason}</span>
                  </label>
                ))}
              </div>

              {/* Descrição opcional */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-foreground/90 mb-2">
                  Descrição adicional (opcional):
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Descreva mais detalhes se necessário..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 bg-card border border-card-border rounded-lg text-foreground placeholder-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                  disabled={isSubmittingReport}
                />
                <div className="text-xs text-foreground/50 mt-1">
                  {reportDescription.length}/500 caracteres
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <button 
                  onClick={handleCloseModal}
                  className="flex-1 bg-card/50 text-foreground border border-card-border rounded-lg px-4 py-2 font-medium hover:bg-card/70 transition-colors disabled:opacity-50"
                  disabled={isSubmittingReport}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSubmitReport}
                  disabled={!reportReason.trim() || isSubmittingReport}
                  className="flex-1 bg-red-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingReport ? 'Enviando...' : 'Enviar Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
