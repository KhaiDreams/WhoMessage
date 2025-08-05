// hooks/useMatches.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { interactionsAPI, Match } from '@/lib/api';

export const useMatches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar matches
  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const matchesData = await interactionsAPI.getMatches();
      setMatches(matchesData);
      return matchesData;
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar matches');
      console.error('Erro ao carregar matches:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar matches na inicialização
  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return {
    matches,
    loading,
    error,
    fetchMatches,
    refresh: fetchMatches
  };
};

export default useMatches;
