"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ChooseInterests() {
  const [interests, setInterests] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api.get('/api/tags/interests').then(res => setInterests(res?.data ?? res ?? []));
  }, []);

  const handleSelect = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (selected.length < 3 || selected.length > 10) return;
    setLoading(true);
    await api.post('/api/tags/interests', { pre_tag_ids: selected });
    router.push('/choose-games');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 to-indigo-500">
      <h1 className="text-3xl font-bold mb-6 text-white">Escolha seus interesses</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {(Array.isArray(interests) ? interests : []).map(tag => (
          <button
            key={tag.id}
            onClick={() => handleSelect(tag.id)}
            className={`px-6 py-3 rounded-lg shadow-lg text-lg font-medium transition-all duration-200 border-2 ${selected.includes(tag.id) ? 'bg-indigo-400 border-white text-white' : 'bg-white border-indigo-300 text-indigo-900'}`}
          >
            {tag.name}
          </button>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={selected.length < 3 || selected.length > 10 || loading}
        className="px-8 py-3 rounded-full bg-white text-indigo-700 font-bold shadow-lg hover:bg-indigo-100 disabled:opacity-50"
      >
        Confirmar
      </button>
    </div>
  );
}
