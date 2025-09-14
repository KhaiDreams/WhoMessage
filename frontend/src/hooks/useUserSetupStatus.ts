import { useState, useEffect } from 'react';
import { tagsAPI, userAPI, UserTagsResponse } from '@/lib/api';

export interface UserSetupStatus {
  hasGames: boolean;
  hasInterests: boolean;
  hasProfile: boolean;
  isLoading: boolean;
  error: string | null;
}

export default function useUserSetupStatus() {
  const [status, setStatus] = useState<UserSetupStatus>({
    hasGames: false,
    hasInterests: false,
    hasProfile: false,
    isLoading: true,
    error: null,
  });

  const [hasInitialized, setHasInitialized] = useState(false);

  const checkUserSetup = async () => {
    // EVITA MÚLTIPLAS EXECUÇÕES - SÓ RODA UMA VEZ!
    if (hasInitialized) {
      return;
    }
    
    setHasInitialized(true); // MARCA COMO INICIALIZADO IMEDIATAMENTE
    
    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));

      // Verificar se tem perfil básico
      const profileResponse = await userAPI.getProfile();
      
      // Backend retorna { user: {...} }
      const user = (profileResponse as any)?.user;

      const hasProfile = !!(user && user.username && user.age);

      // Verificar se tem games
      const userGamesResponse = await tagsAPI.getUserGames();
      
      const hasGames = !!(
        userGamesResponse && 
        typeof userGamesResponse === 'object' &&
        Object.keys(userGamesResponse).length > 0 && // Não é objeto vazio {}
        'pre_tag_ids' in userGamesResponse &&
        userGamesResponse.pre_tag_ids && 
        Array.isArray(userGamesResponse.pre_tag_ids) && 
        userGamesResponse.pre_tag_ids.length > 0
      );

      // Verificar se tem interests
      const userInterestsResponse = await tagsAPI.getUserInterests();
      
      const hasInterests = !!(
        userInterestsResponse && 
        typeof userInterestsResponse === 'object' &&
        Object.keys(userInterestsResponse).length > 0 && // Não é objeto vazio {}
        'pre_tag_ids' in userInterestsResponse &&
        userInterestsResponse.pre_tag_ids && 
        Array.isArray(userInterestsResponse.pre_tag_ids) && 
        userInterestsResponse.pre_tag_ids.length > 0
      );

      setStatus({
        hasGames,
        hasInterests,
        hasProfile,
        isLoading: false,
        error: null,
      });

      setHasInitialized(true); // MARCA COMO INICIALIZADO

      return {
        hasGames,
        hasInterests,
        hasProfile,
        profile: user, // Retorna o user diretamente
        userGames: userGamesResponse,
        userInterests: userInterestsResponse,
      };

    } catch (error: any) {
      console.error('❌ [DEBUG] Erro ao verificar setup do usuário:', error);
      console.error('❌ [DEBUG] Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Erro ao verificar dados do usuário',
      }));
      setHasInitialized(true); // MARCA COMO INICIALIZADO MESMO COM ERRO
      return null;
    }
  };

  useEffect(() => {
    if (!hasInitialized) {
      checkUserSetup();
    }
  }, [hasInitialized]);

  return {
    ...status,
    refresh: checkUserSetup,
  };
}
