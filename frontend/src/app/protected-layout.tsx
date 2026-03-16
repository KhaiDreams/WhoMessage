"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

const PUBLIC_ROUTES = ["/login", "/register", "/", "/_error"];

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <span className="text-lg text-foreground/70">Carregando...</span>
  </div>
);

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname || "";
  const [isAllowed, setIsAllowed] = useState<null | boolean>(null);
  const isPublicRoute = PUBLIC_ROUTES.includes(currentPath);
  const {
    isLoading,
    isAuthenticated,
    user,
    hasProfile,
    hasGames,
    hasInterests,
    clearSession,
  } = useAuth();

  useEffect(() => {
    if (isPublicRoute) {
      setIsAllowed(null);
      return;
    }

    if (isLoading) {
      setIsAllowed(null);
      return;
    }

    if (!isAuthenticated || !user) {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        // Aguarda hidratação da sessão compartilhada para evitar redirect indevido.
        setIsAllowed(null);
        return;
      }
      router.replace("/login");
      setIsAllowed(false);
      return;
    }

    if (user.ban || user.active === false) {
      clearSession();
      router.replace("/login");
      setIsAllowed(false);
      return;
    }

    if (!hasProfile && currentPath !== "/register") {
      router.replace("/register");
      setIsAllowed(false);
      return;
    }

    if (!hasGames && currentPath !== "/choose-games") {
      router.replace("/choose-games");
      setIsAllowed(false);
      return;
    }

    if (!hasInterests && currentPath !== "/choose-interests") {
      router.replace("/choose-interests");
      setIsAllowed(false);
      return;
    }

    setIsAllowed(true);
  }, [
    isPublicRoute,
    currentPath,
    isLoading,
    isAuthenticated,
    user,
    hasProfile,
    hasGames,
    hasInterests,
    clearSession,
    router,
  ]);

  if (isPublicRoute) return <>{children}</>;
  if (isAllowed === null) return <Loader />;
  if (!isAllowed) return null;
  return <>{children}</>;
}
