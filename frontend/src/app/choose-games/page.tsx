"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-900 to-pink-500">
      <h1 className="text-3xl font-bold mb-6 text-white">Escolha seus jogos favoritos</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {(Array.isArray(games) ? games : []).map(game => (
          <button
            key={game.id}
            onClick={() => handleSelect(game.id)}
            className={`px-6 py-3 rounded-lg shadow-lg text-lg font-medium transition-all duration-200 border-2 ${selected.includes(game.id) ? 'bg-pink-400 border-white text-white' : 'bg-white border-pink-300 text-pink-900'}`}
          >
            {game.name}
          </button>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={selected.length < 3 || selected.length > 20 || loading}
        className="px-8 py-3 rounded-full bg-white text-pink-700 font-bold shadow-lg hover:bg-pink-100 disabled:opacity-50"
      >
        Confirmar
      </button>
    </div>
  );
}
