"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import api from '@/lib/api';

export default function Login() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Se já estiver autenticado, redireciona para /home
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        router.replace('/home');
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const data = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ login, password }),
      });

      localStorage.setItem("token", data.token);

      // Após login bem-sucedido:
      // Verifica se usuário já tem tags
      const userHasTags = await api.get('/api/tags/interests-user');
      if (!userHasTags || !userHasTags.name || userHasTags.name.length < 3) {
        router.push('/choose-interests');
      } else {
        const userHasGames = await api.get('/api/tags/games-user');
        if (!userHasGames || !userHasGames.name || userHasGames.name.length < 3) {
          router.push('/choose-games');
        } else {
          router.push('/home');
        }
      }
    } catch (error) {
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <main className="flex flex-col gap-8 items-center w-full max-w-md bg-card rounded-2xl shadow-2xl p-8 border border-card-border">
        <Image
          className="white:invert mb-2"
          src="/assets/logo-removebg-preview.png"
          alt="WhoMessage Logo"
          width={220}
          height={40}
          priority
        />
        <form onSubmit={handleLogin} className="flex flex-col gap-5 w-full">
          <input
            type="text"
            placeholder="Email ou Username"
            value={login}
            onChange={e => setLogin(e.target.value)}
            className="px-4 py-3 rounded-lg bg-input-bg border border-input-border text-input-text placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-input-focus transition-all duration-200"
            required
          />
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="px-4 py-3 pr-12 rounded-lg bg-input-bg border border-input-border text-input-text placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-input-focus transition-all duration-200 w-full"
              required
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary focus:outline-none"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4.03-9-7 0-1.13.47-2.36 1.32-3.54m2.1-2.38C7.7 5.7 9.76 5 12 5c5 0 9 4.03 9 7 0 1.13-.47 2.36-1.32 3.54-.36.5-.78.98-1.25 1.43M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" strokeWidth="2" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-700 to-indigo-700 text-white font-bold shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-200 ease-in-out tracking-wide text-lg border-none outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          >
            <span className="flex items-center justify-center gap-2">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline-block"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
              Entrar
            </span>
          </button>
        </form>
        <p className="text-sm text-foreground/70 text-center mt-2">
          Não tem uma conta?{' '}
          <Link href="/register" className="text-primary hover:underline font-semibold transition-colors">Cadastre-se</Link>
        </p>
      </main>
    </div>
  );
}
