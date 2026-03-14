"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { tagsAPI } from '@/lib/api';
import Image from 'next/image';
import { Search, ChevronLeft, ChevronRight, Check } from 'lucide-react';

export default function ChooseGames() {
  const [games, setGames] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const pageSize = 12;
  const router = useRouter();

  // Verificar se o usuário já tem games e interests configurados
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        // Verificar se já tem games
        const userGamesResponse = await tagsAPI.getUserGames();
        const hasGames = !!(
          userGamesResponse && 
          typeof userGamesResponse === 'object' &&
          Object.keys(userGamesResponse).length > 0 &&
          'pre_tag_ids' in userGamesResponse &&
          userGamesResponse.pre_tag_ids && 
          Array.isArray(userGamesResponse.pre_tag_ids) && 
          userGamesResponse.pre_tag_ids.length > 0
        );

        // Verificar se já tem interests  
        const userInterestsResponse = await tagsAPI.getUserInterests();
        const hasInterests = !!(
          userInterestsResponse && 
          typeof userInterestsResponse === 'object' &&
          Object.keys(userInterestsResponse).length > 0 &&
          'pre_tag_ids' in userInterestsResponse &&
          userInterestsResponse.pre_tag_ids && 
          Array.isArray(userInterestsResponse.pre_tag_ids) && 
          userInterestsResponse.pre_tag_ids.length > 0
        );

        // Se já tem ambos, vai para home
        if (hasGames && hasInterests) {
          router.push('/home');
          return;
        }

        // Se já tem games mas não tem interests, vai para interests
        if (hasGames && !hasInterests) {
          router.push('/choose-interests');
          return;
        }

        // Se chegou aqui, precisa configurar games
        setChecking(false);
      } catch (error) {
        console.error('Erro ao verificar status do usuário:', error);
        setChecking(false);
      }
    };

    checkUserStatus();
  }, [router]);

  useEffect(() => {
    if (!checking) {
      tagsAPI.getGames().then(setGames).catch(console.error);
    }
  }, [checking]);

  const handleSelect = (id: number) => {
    setError(null);
    setSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else {
        if (prev.length >= 20) {
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  // Show error if user reaches the max selection
  useEffect(() => {
    if (selected.length === 20) {
      setError('Você só pode selecionar até 20 jogos.');
    } else if (error && selected.length < 20) {
      setError(null);
    }
  }, [selected.length]);

  const handleSubmit = async () => {
    if (selected.length < 3) {
      setError('Selecione pelo menos 3 jogos.');
      return;
    }
    if (selected.length > 20) {
      setError('Você só pode selecionar até 20 jogos.');
      return;
    }
    setLoading(true);
    try {
      await tagsAPI.updateUserGames(selected);
      
      // Verificar se já tem interests antes de redirecionar
      try {
        const userInterestsResponse = await tagsAPI.getUserInterests();
        const hasInterests = !!(
          userInterestsResponse && 
          typeof userInterestsResponse === 'object' &&
          Object.keys(userInterestsResponse).length > 0 &&
          'pre_tag_ids' in userInterestsResponse &&
          userInterestsResponse.pre_tag_ids && 
          Array.isArray(userInterestsResponse.pre_tag_ids) && 
          userInterestsResponse.pre_tag_ids.length > 0
        );

        // Se já tem interests, vai direto para home
        if (hasInterests) {
          router.push('/home');
        } else {
          router.push('/choose-interests');
        }
      } catch {
        // Se der erro ao verificar interests, vai para interests mesmo
        router.push('/choose-interests');
      }
    } catch (e) {
      setError('Erro ao salvar jogos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Filtragem e paginação
  const filteredGames = useMemo(() => {
    if (!search) return games;
    return games.filter(game =>
      game.name?.toLowerCase().includes(search.toLowerCase()) ||
      (game.category && game.category.toLowerCase().includes(search.toLowerCase()))
    );
  }, [games, search]);

  const paginatedGames = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredGames.slice(start, start + pageSize);
  }, [filteredGames, page]);

  const totalPages = Math.ceil(filteredGames.length / pageSize) || 1;

  // Mostrar loading enquanto verifica status do usuário
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Verificando seu perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Cabeçalho fixo */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-card-border px-4 py-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/logo-removebg-preview.png"
              alt="WhoMessage"
              width={110}
              height={20}
              priority
            />
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-foreground">Jogos favoritos</h1>
              <p className="text-xs text-foreground/50">Mín. 3 · máx. 20</p>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
            selected.length >= 3
              ? 'bg-green-500/20 text-green-400 border-green-500/30'
              : 'bg-card text-foreground/60 border-card-border'
          }`}>
            {selected.length}/20 {selected.length >= 3 ? '✓' : '(mín. 3)'}
          </span>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Pesquisar jogo ou categoria..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-card border border-card-border text-foreground placeholder-foreground/40 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none text-sm transition-colors"
            />
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2.5 rounded-lg bg-card border border-card-border text-foreground disabled:opacity-40 hover:border-primary/50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-foreground/60 px-1.5 min-w-[52px] text-center font-medium">{page}/{totalPages}</span>
            <button
              type="button"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2.5 rounded-lg bg-card border border-card-border text-foreground disabled:opacity-40 hover:border-primary/50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid de jogos */}
      <div className="px-4 pt-4 pb-28">
        {paginatedGames.length === 0 && (
          <div className="text-center text-foreground/60 py-12">Nenhum jogo encontrado.</div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {paginatedGames.map(game => {
            const isSelected = selected.includes(game.id);
            return (
              <button
                key={game.id}
                type="button"
                onClick={() => handleSelect(game.id)}
                disabled={!isSelected && selected.length >= 20}
                aria-pressed={isSelected}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-[transform,border-color,background-color,box-shadow] duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:z-10 ${
                  isSelected
                    ? 'bg-primary/15 border-primary shadow-lg scale-[1.02]'
                    : 'bg-card border-card-border hover:border-primary/50 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100'
                }`}
              >
                {game.image ? (
                  <img
                    src={game.image}
                    alt={game.name}
                    className="w-14 h-14 object-cover rounded-lg"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">🎮</div>
                )}
                <div className="w-full text-center">
                  <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">{game.name}</p>
                  {game.category && (
                    <p className="text-[10px] text-foreground/50 mt-0.5 truncate">{game.category}</p>
                  )}
                </div>
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra inferior fixa */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-card-border px-4 py-3">
        {error && <p className="text-red-500 text-xs text-center mb-2">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={selected.length < 3 || loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 via-fuchsia-700 to-indigo-700 text-white font-bold shadow-lg transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Salvando...
            </>
          ) : (
            <>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
              Confirmar{selected.length >= 3 ? ` (${selected.length} jogos)` : ''}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
