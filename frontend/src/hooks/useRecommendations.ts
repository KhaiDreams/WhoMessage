// hooks/useRecommendations.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { userAPI, interactionsAPI, Recommendation, RecommendationsResponse, Like } from '@/lib/api';
import { toast } from 'react-toastify';

export const useRecommendations = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [stats, setStats] = useState<RecommendationsResponse['stats'] | null>(null);
  const [userProfile, setUserProfile] = useState<RecommendationsResponse['userProfile'] | null>(null);
  const [pendingLikes, setPendingLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar recomendações
  const fetchRecommendations = useCallback(async (limit = 20) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userAPI.getRecommendations(limit);
      setRecommendations(response.recommendations);
      setStats(response.stats);
      setUserProfile(response.userProfile);
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
    try {
      const response = await interactionsAPI.likeUser(userId, action);
      
      // Remover usuário das recomendações
      setRecommendations(prev => prev.filter(rec => rec.user.id !== userId));
      
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
    fetchRecommendations();
    fetchPendingLikes();
  }, [fetchRecommendations, fetchPendingLikes]);

  return {
    recommendations,
    stats,
    userProfile,
    pendingLikes,
    loading,
    error,
    fetchRecommendations,
    fetchPendingLikes,
    handleUserAction,
    respondToPendingLike,
    refresh: () => {
      fetchRecommendations();
      fetchPendingLikes();
    }
  };
};

export default useRecommendations;
