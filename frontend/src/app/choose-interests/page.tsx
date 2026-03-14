"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tagsAPI } from '@/lib/api';
import Image from 'next/image';
import { Check } from 'lucide-react';

export default function ChooseInterests() {
  const [interests, setInterests] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
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

        // Se não tem games, redireciona para games primeiro
        if (!hasGames) {
          router.push('/choose-games');
          return;
        }

        // Se já tem interests, vai para home
        if (hasInterests) {
          router.push('/home');
          return;
        }

        // Se chegou aqui, tem games mas não tem interests - pode configurar
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
      tagsAPI.getInterests().then(setInterests).catch(console.error);
    }
  }, [checking]);

  const handleSelect = (id: number) => {
    setError(null);
    setSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else {
        if (prev.length >= 10) {
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  // Exibe erro ao atingir o máximo de interesses
  useEffect(() => {
    if (selected.length === 10) {
      setError('Você só pode selecionar até 10 interesses.');
    } else if (error && selected.length < 10) {
      setError(null);
    }
  }, [selected.length]);

  const handleSubmit = async () => {
    if (selected.length < 3) {
      setError('Selecione pelo menos 3 interesses.');
      return;
    }
    if (selected.length > 10) {
      setError('Você só pode selecionar até 10 interesses.');
      return;
    }
    setLoading(true);
    try {
      await tagsAPI.updateUserInterests(selected);
      router.push('/home');
    } catch (e) {
      setError('Erro ao salvar interesses. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-card-border px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/logo-removebg-preview.png"
            alt="WhoMessage"
            width={110}
            height={20}
            priority
          />
          <div>
            <h1 className="text-sm font-bold text-foreground">Seus interesses</h1>
            <p className="text-xs text-foreground/50">Mín. 3 · máx. 10</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
          selected.length >= 3
            ? 'bg-green-500/20 text-green-400 border-green-500/30'
            : 'bg-card text-foreground/60 border-card-border'
        }`}>
          {selected.length}/10 {selected.length >= 3 ? '✓' : '(mín. 3)'}
        </span>
      </div>

      {/* Chips de interesses */}
      <div className="px-4 pt-6 pb-28">
        <div className="flex flex-wrap gap-3">
          {(Array.isArray(interests) ? interests : []).map(tag => {
            const isSelected = selected.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleSelect(tag.id)}
                disabled={!isSelected && selected.length >= 10}
                aria-pressed={isSelected}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border font-medium text-sm transition-[transform,background-color,border-color,box-shadow] duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:z-10 ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-600 via-fuchsia-700 to-indigo-700 border-transparent text-white shadow-md scale-[1.03]'
                    : 'bg-card border-card-border text-foreground hover:border-primary/50 hover:scale-[1.03] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                <span>{tag.name}</span>
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
              Confirmar{selected.length >= 3 ? ` (${selected.length} interesses)` : ''}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
