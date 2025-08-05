"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userAPI, tagsAPI } from '@/lib/api';

interface AuthState {
  isAuthenticated: boolean;
  hasProfile: boolean;
  hasGames: boolean;
  hasInterests: boolean;
  isLoading: boolean;
  user: any;
}

export default function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    hasProfile: false,
    hasGames: false,
    hasInterests: false,
    isLoading: true,
    user: null,
  });

  const checkAuth = async () => {
    try {
      
      // Verificar se está logado
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Buscar dados do usuário
      const profileResponse = await userAPI.getProfile();
      const user = (profileResponse as any)?.user;
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Verificar se tem perfil completo
      const hasProfile = !!(user.username && user.age);

      if (!hasProfile) {
        router.push('/register');
        return;
      }

      // Verificar games
      const gamesResponse = await tagsAPI.getUserGames();
      const hasGames = !!(
        gamesResponse && 
        Object.keys(gamesResponse).length > 0 &&
        (gamesResponse as any).pre_tag_ids &&
        Array.isArray((gamesResponse as any).pre_tag_ids) &&
        (gamesResponse as any).pre_tag_ids.length > 0
      );

      if (!hasGames) {
        router.push('/choose-games');
        return;
      }

      // Verificar interests
      const interestsResponse = await tagsAPI.getUserInterests();
      const hasInterests = !!(
        interestsResponse && 
        Object.keys(interestsResponse).length > 0 &&
        (interestsResponse as any).pre_tag_ids &&
        Array.isArray((interestsResponse as any).pre_tag_ids) &&
        (interestsResponse as any).pre_tag_ids.length > 0
      );

      if (!hasInterests) {
        router.push('/choose-interests');
        return;
      }
      setState({
        isAuthenticated: true,
        hasProfile,
        hasGames,
        hasInterests,
        isLoading: false,
        user,
      });

    } catch (error) {
      console.error('❌ [AUTH] Erro:', error);
      router.push('/login');
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return state;
}
