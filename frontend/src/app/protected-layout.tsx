"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthToken } from "@/hooks/useLocalStorage";

// Rotas públicas (não exigem login)
const PUBLIC_ROUTES = ["/login", "/register", "/", "/_error"];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAllowed, setIsAllowed] = useState<null | boolean>(null);
  const [token, setAuthToken, isTokenLoading] = useAuthToken();

  useEffect(() => {
    // Se for rota pública, libera
    if (PUBLIC_ROUTES.includes(pathname)) {
      setIsAllowed(true);
      return;
    }

    // Aguarda o token carregar do localStorage
    if (isTokenLoading) return;

    const check = async () => {
      if (!token) {
        router.replace("/login");
        setIsAllowed(false);
        return;
      }
      
      try {
        const me = await api.get("/api/user/me");
        if (!me || me.ban || me.active === false) {
          setAuthToken(null);
          router.replace("/login");
          setIsAllowed(false);
        } else {
          setIsAllowed(true);
        }
      } catch (error) {
        console.warn("Auth check failed:", error);
        setAuthToken(null);
        router.replace("/login");
        setIsAllowed(false);
      }
    };
    
    check();
  }, [pathname, token, isTokenLoading, router, setAuthToken]);

  // Loading state enquanto verifica auth ou token
  if (isAllowed === null || isTokenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <span className="text-lg text-foreground/70">Carregando...</span>
        </div>
      </div>
    );
  }
  
  if (!isAllowed) return null;
  return <>{children}</>;
}
