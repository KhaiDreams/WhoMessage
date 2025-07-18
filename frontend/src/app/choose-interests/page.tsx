"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Image from 'next/image';

export default function ChooseInterests() {
  const [interests, setInterests] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    api.get('/api/tags/interests').then(res => setInterests(res?.data ?? res ?? []));
  }, []);

  const handleSelect = (id: number) => {
    setError(null);
    setSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else {
        // Não seta erro aqui, deixa o useEffect cuidar disso
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
      await api.post('/api/tags/interests', { pre_tag_ids: selected });
      router.push('/choose-games');
    } catch (e) {
      setError('Erro ao salvar interesses. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-foreground mb-2 text-center">Escolha seus interesses</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
          {(Array.isArray(interests) ? interests : []).map(tag => {
            const isSelected = selected.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleSelect(tag.id)}
                className={`flex flex-col items-start px-6 py-4 min-h-[64px] rounded-2xl font-semibold border-2 transition-all duration-200 text-base shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:z-10 whitespace-normal
                  ${isSelected
                    ? 'bg-gradient-to-r from-pink-600 via-fuchsia-700 to-indigo-700 border-primary text-white scale-105 shadow-2xl'
                    : 'bg-input-bg border-input-border text-foreground hover:bg-card hover:border-primary/60 hover:scale-105'}
                `}
                aria-pressed={isSelected}
                disabled={!isSelected && selected.length >= 10}
              >
                <span className="text-lg font-semibold">{tag.name}</span>
              </button>
            );
          })}
        </div>
        {error && (
          <div className="w-full text-center text-red-600 font-semibold mt-2 animate-pulse">{error}</div>
        )}
        <button
          onClick={handleSubmit}
          disabled={selected.length < 3 || selected.length > 10 || loading}
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
