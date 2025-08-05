"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useUserSetupStatus from '@/hooks/useUserSetupStatus';

interface SetupCheckProps {
  children: React.ReactNode;
}

export default function SetupCheck({ children }: SetupCheckProps) {
  const router = useRouter();
  const { hasGames, hasInterests, hasProfile, isLoading, error } = useUserSetupStatus();
  const [showContent, setShowContent] = useState(false);
  const [redirectExecuted, setRedirectExecuted] = useState(false);

  useEffect(() => {
    if (!hasProfile) {
      setRedirectExecuted(true);
      router.push('/register');
    } else if (!hasGames) {
      setRedirectExecuted(true);
      router.push('/choose-games');
    } else if (!hasInterests) {
      setRedirectExecuted(true);
      router.push('/choose-interests');
    }
  }, [hasGames, hasInterests, hasProfile, isLoading, error, router, redirectExecuted]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Verificando seu perfil...</p>
        </div>
      </div>
    );
  }

  if (!showContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
