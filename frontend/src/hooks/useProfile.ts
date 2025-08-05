// hooks/useProfile.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { userAPI, tagsAPI, User, Tag } from '@/lib/api';
import { toast } from 'react-toastify';

export const useProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [games, setGames] = useState<Tag[]>([]);
  const [interests, setInterests] = useState<Tag[]>([]);
  const [userGames, setUserGames] = useState<number[]>([]);
  const [userInterests, setUserInterests] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar perfil do usuário
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userAPI.getProfile();
      setUser(response.user);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar perfil');
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar tags disponíveis
  const fetchTags = useCallback(async () => {
    try {
      const [gamesData, interestsData] = await Promise.all([
        tagsAPI.getGames(),
        tagsAPI.getInterests()
      ]);
      setGames(gamesData);
      setInterests(interestsData);
    } catch (err: any) {
      console.error('Erro ao buscar tags:', err);
    }
  }, []);

  // Atualizar perfil
  const updateProfile = useCallback(async (userData: Partial<User>) => {
    try {
      if (!user?.id) {
        throw new Error('Usuário não encontrado');
      }
      
      setLoading(true);
      const updatedUser = await userAPI.updateProfile({ ...userData, id: user.id });
      setUser(prev => prev ? { ...prev, ...updatedUser } : updatedUser);
      toast.success('Perfil atualizado com sucesso!');
      return updatedUser;
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar perfil');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Atualizar jogos do usuário
  const updateUserGames = useCallback(async (gameIds: number[]) => {
    try {
      await tagsAPI.updateUserGames(gameIds);
      setUserGames(gameIds);
      toast.success('Jogos atualizados com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar jogos');
      throw err;
    }
  }, []);

  // Atualizar interesses do usuário
  const updateUserInterests = useCallback(async (interestIds: number[]) => {
    try {
      await tagsAPI.updateUserInterests(interestIds);
      setUserInterests(interestIds);
      toast.success('Interesses atualizados com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar interesses');
      throw err;
    }
  }, []);

  // Verificar se usuário está autenticado
  const isAuthenticated = useCallback(() => {
    return !!localStorage.getItem('token');
  }, []);

  // Fazer logout
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setUserGames([]);
    setUserInterests([]);
    window.location.href = '/login';
  }, []);

  // Carregar dados na inicialização
  useEffect(() => {
    if (isAuthenticated()) {
      fetchProfile();
      fetchTags();
    }
  }, [fetchProfile, fetchTags, isAuthenticated]);

  return {
    user,
    games,
    interests,
    userGames,
    userInterests,
    loading,
    error,
    updateProfile,
    updateUserGames,
    updateUserInterests,
    fetchProfile,
    isAuthenticated,
    logout,
    refresh: () => {
      fetchProfile();
      fetchTags();
    }
  };
};

export default useProfile;
