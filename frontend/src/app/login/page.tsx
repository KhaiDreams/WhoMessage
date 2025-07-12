"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import api from '@/lib/api';

export default function Login() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

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
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="px-4 py-3 rounded-lg bg-input-bg border border-input-border text-input-text placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-input-focus transition-all duration-200"
            required
          />
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
