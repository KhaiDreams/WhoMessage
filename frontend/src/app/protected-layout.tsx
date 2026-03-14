"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/api";

const PUBLIC_ROUTES = ["/login", "/register", "/", "/_error"];

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <span className="text-lg text-foreground/70">Carregando...</span>
  </div>
);

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isAllowed, setIsAllowed] = useState<null | boolean>(null);

  // Primeiro useEffect só para marcar que o componente está montado no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (PUBLIC_ROUTES.includes(pathname)) {
      setIsAllowed(true);
      return;
    }
    const check = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        setIsAllowed(false);
        return;
      }
      try {
        const me = await api.get("/api/user/me");
        if (!me || (me as any).ban || (me as any).active === false) {
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
  }, [mounted, pathname, router]);

  // Antes de montar: servidor e cliente renderizam o mesmo markup → sem hydration mismatch
  if (!mounted) return <Loader />;
  if (isAllowed === null) return <Loader />;
  if (!isAllowed) return null;
  return <>{children}</>;
}
