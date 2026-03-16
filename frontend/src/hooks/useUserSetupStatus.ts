import { useState, useEffect } from 'react';
import { userAPI } from '@/lib/api';

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

      const bootstrap = await userAPI.getBootstrap();
      const { user, setupStatus } = bootstrap;
      const hasProfile = setupStatus.hasProfile;
      const hasGames = setupStatus.hasGames;
      const hasInterests = setupStatus.hasInterests;

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
        profile: user,
        tags: bootstrap.tags,
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
