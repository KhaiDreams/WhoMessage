"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { tagsAPI } from '@/lib/api';
import Image from 'next/image';

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <main className="flex flex-col gap-8 items-center w-full max-w-4xl bg-card rounded-2xl shadow-2xl p-8 border border-card-border">
        <Image
          className="white:invert mb-2"
          src="/assets/logo-removebg-preview.png"
          alt="WhoMessage Logo"
          width={220}
          height={40}
          priority
        />
        <h1 className="text-2xl font-bold text-foreground mb-2 text-center">Escolha seus jogos favoritos</h1>
        <div className="flex flex-col sm:flex-row items-center justify-between w-full mb-4 gap-4">
          <input
            type="text"
            placeholder="Pesquisar jogo ou categoria..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full sm:w-96 px-5 py-3 rounded-xl bg-[#23243a] border-0 text-white placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-accent shadow-md"
            style={{ fontSize: '1.1rem', fontWeight: 500 }}
          />
          <div className="flex gap-2 items-center mt-2 sm:mt-0">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl bg-[#181a20] text-foreground font-bold shadow border-0 disabled:opacity-40 hover:bg-[#23243a] transition"
            >
              &lt;
            </button>
            <span className="text-base text-foreground/80 font-semibold">Página {page} de {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl bg-[#181a20] text-foreground font-bold shadow border-0 disabled:opacity-40 hover:bg-[#23243a] transition"
            >
              &gt;
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 w-full">
          {paginatedGames.length === 0 && (
            <div className="col-span-full text-center text-foreground/60 py-8">Nenhum jogo encontrado.</div>
          )}
          {paginatedGames.map(game => {
            const isSelected = selected.includes(game.id);
            return (
              <button
                key={game.id}
                type="button"
                onClick={() => handleSelect(game.id)}
                className={`group relative flex flex-col items-center justify-between px-4 py-5 min-h-[180px] rounded-3xl font-semibold border-0 transition-all duration-200 text-base shadow-xl focus:outline-none focus:ring-2 focus:ring-accent focus:z-10 bg-gradient-to-br from-[#23243a] to-[#181a20] hover:scale-[1.03] hover:shadow-2xl overflow-hidden
                  ${isSelected ? 'ring-4 ring-pink-600 scale-105' : ''}
                `}
                aria-pressed={isSelected}
                disabled={!isSelected && selected.length >= 20}
              >
                <div className="w-full flex flex-col items-center mb-2">
                  {game.image && (
                    <img src={game.image} alt={game.name} className="w-16 h-16 object-cover rounded-2xl border-2 border-[#23243a] bg-card shadow-md group-hover:scale-110 transition" />
                  )}
                </div>
                <div className="flex flex-col items-center flex-1 min-w-0 w-full">
                  <span className="text-lg font-bold leading-tight text-center truncate w-full" title={game.name}>{game.name}</span>
                  {game.category && <span className="text-xs opacity-70 mt-1 text-center w-full truncate">{game.category}</span>}
                </div>
                {isSelected && (
                  <span className="absolute top-2 right-2 bg-gradient-to-r from-pink-600 via-fuchsia-700 to-indigo-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse z-10">Selecionado</span>
                )}
              </button>
            );
          })}
        </div>
        {error && (
          <div className="w-full text-center text-red-600 font-semibold mt-2 animate-pulse">{error}</div>
        )}
        <button
          onClick={handleSubmit}
          disabled={selected.length < 3 || selected.length > 20 || loading}
          className="mt-4 w-full py-3 rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-700 to-indigo-700 text-white font-bold shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-200 ease-in-out tracking-wide text-lg border-none outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50"
        >
          <span className="flex items-center justify-center gap-2">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline-block"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
            Confirmar
          </span>
        </button>
      </main>
    </div>
  );
}
