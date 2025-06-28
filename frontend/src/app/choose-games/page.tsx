"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Image from 'next/image';

export default function ChooseGames() {
  const [games, setGames] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api.get('/api/tags/games').then(res => setGames(res?.data ?? res ?? []));
  }, []);

  const handleSelect = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (selected.length < 3 || selected.length > 20) return;
    setLoading(true);
    await api.post('/api/tags/games', { pre_tag_ids: selected });
    router.push('/home');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <main className="flex flex-col gap-8 items-center w-full max-w-md bg-card rounded-2xl shadow-2xl p-8 border border-card-border">
        <Image
          className="white:invert mb-2"
          src="/assets/logo-removebg-preview.png"
          alt="WhoMessage Logo"
          width={220}
          height={40}
          priority
        />
        <h1 className="text-2xl font-bold text-foreground mb-2 text-center">Escolha seus jogos favoritos</h1>
        <div className="grid grid-cols-2 gap-3 w-full">
          {(Array.isArray(games) ? games : []).map(game => {
            const isSelected = selected.includes(game.id);
            return (
              <button
                key={game.id}
                type="button"
                onClick={() => handleSelect(game.id)}
                className={`px-4 py-3 rounded-xl font-semibold border-2 transition-all duration-200 text-base shadow-lg focus:outline-none focus:ring-2 focus:ring-accent focus:z-10
                  ${isSelected
                    ? 'bg-gradient-to-r from-pink-600 via-fuchsia-700 to-indigo-700 border-accent text-white scale-105 shadow-2xl'
                    : 'bg-input-bg border-input-border text-foreground hover:bg-card hover:border-accent/60 hover:scale-105'}
                `}
              >
                {game.name}
              </button>
            );
          })}
        </div>
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
