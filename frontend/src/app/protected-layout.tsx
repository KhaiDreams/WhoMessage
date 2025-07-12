"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/api";

// Rotas públicas (não exigem login)
const PUBLIC_ROUTES = ["/login", "/register", "/", "/_error"];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAllowed, setIsAllowed] = useState<null | boolean>(null);

  useEffect(() => {
    // Se for rota pública, libera
    if (PUBLIC_ROUTES.includes(pathname)) {
      setIsAllowed(true);
      return;
    }
    const check = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        router.replace("/login");
        setIsAllowed(false);
        return;
      }
      try {
        const me = await api.get("/api/user/me");
        if (!me || me.ban || me.active === false) {
          localStorage.removeItem("token");
          router.replace("/login");
          setIsAllowed(false);
        } else {
          setIsAllowed(true);
        }
      } catch {
        localStorage.removeItem("token");
        router.replace("/login");
        setIsAllowed(false);
      }
    };
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (isAllowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-lg text-foreground/70">Carregando...</span>
      </div>
    );
  }
  if (!isAllowed) return null;
  return <>{children}</>;
}
