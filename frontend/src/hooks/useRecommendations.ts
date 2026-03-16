// hooks/useRecommendations.ts
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { userAPI, interactionsAPI, Recommendation, RecommendationsResponse, Like } from '@/lib/api';
import { toast } from 'react-toastify';

export const useRecommendations = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [stats, setStats] = useState<RecommendationsResponse['stats'] | null>(null);
  const [userProfile, setUserProfile] = useState<RecommendationsResponse['userProfile'] | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<number | null>(0);
  const hasMoreRef = useRef(true);
  const nextCursorRef = useRef<number | null>(0);
  const [pendingLikes, setPendingLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recommendationsRef = useRef<Recommendation[]>([]);

  useEffect(() => {
    recommendationsRef.current = recommendations;
  }, [recommendations]);

  // Buscar recomendações
  const fetchRecommendations = useCallback(async (limit = 20, reset = false) => {
    const cursor = reset ? 0 : nextCursorRef.current;

    if (!reset && (cursor === null || !hasMoreRef.current)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await userAPI.getRecommendations(limit, cursor ?? 0);
      setRecommendations(prev => {
        if (reset) return response.recommendations;
        const existingIds = new Set(prev.map(rec => rec.user.id));
        const merged = [...prev];
        for (const rec of response.recommendations) {
          if (!existingIds.has(rec.user.id)) merged.push(rec);
        }
        return merged;
      });
      setStats(response.stats);
      setUserProfile(response.userProfile);
      setHasMore(response.pagination.hasMore);
      setNextCursor(response.pagination.nextCursor);
      hasMoreRef.current = response.pagination.hasMore;
      nextCursorRef.current = response.pagination.nextCursor;
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar recomendações');
      console.error('Erro ao carregar recomendações:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar curtidas pendentes
  const fetchPendingLikes = useCallback(async () => {
    try {
      const data = await interactionsAPI.getPendingLikes();
      setPendingLikes(data);
    } catch (err: any) {
      console.error('Erro ao buscar curtidas pendentes:', err);
    }
  }, []);

  // Curtir ou passar usuário
  const handleUserAction = useCallback(async (userId: number, action: 'like' | 'pass') => {
    const removedRecommendation = recommendationsRef.current.find((rec) => rec.user.id === userId);

    // Remove de forma otimista para o swipe ficar fluido.
    setRecommendations((prev) => prev.filter((rec) => rec.user.id !== userId));

    try {
      const response = await interactionsAPI.likeUser(userId, action);

      if (action === 'like') {
        if (response.match) {
          toast.success('🎉 É um match! Vocês se curtiram!', {
            position: "top-center",
            autoClose: 5000,
          });
        } else {
          toast.success('💖 Like enviado!', {
            position: "top-right",
            autoClose: 2000,
          });
        }
      }

      return response;
    } catch (err: any) {
      // Em caso de erro de rede/transiente, recoloca no topo para não perder perfil.
      if (removedRecommendation && /network|conex|timeout|fetch/i.test(err?.message || '')) {
        setRecommendations((prev) => {
          if (prev.some((rec) => rec.user.id === removedRecommendation.user.id)) {
            return prev;
          }
          return [removedRecommendation, ...prev];
        });
      }

      toast.error(err.message || 'Erro ao processar ação');
      throw err;
    }
  }, []);

  // Responder a uma curtida pendente
  const respondToPendingLike = useCallback(async (likeId: number, fromUserId: number, action: 'like' | 'pass') => {
    try {
      const response = await handleUserAction(fromUserId, action);
      
      // Remover da lista de pendentes
      setPendingLikes(prev => prev.filter(like => like.id !== likeId));
      
      return response;
    } catch (err: any) {
      throw err;
    }
  }, [handleUserAction]);

  // Carregar dados na inicialização
  useEffect(() => {
    fetchRecommendations(20, true);
    fetchPendingLikes();
  }, [fetchRecommendations, fetchPendingLikes]);

  return {
    recommendations,
    stats,
    userProfile,
    hasMore,
    nextCursor,
    pendingLikes,
    loading,
    error,
    fetchRecommendations,
    fetchPendingLikes,
    handleUserAction,
    respondToPendingLike,
    refresh: () => {
      fetchRecommendations(20, true);
      fetchPendingLikes();
    }
  };
};

export default useRecommendations;
