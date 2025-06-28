"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import api from '@/lib/api';

export default function Login() {
  const [email, setEmail] = useState("");
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
        body: JSON.stringify({ email, password }),
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
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
          className="white:invert"
          src="/assets/logo-removebg-preview.png"
          alt="WhoMessage Logo"
          width={400}
          height={40}
          priority
        />
        <form onSubmit={handleLogin} className="flex flex-col gap-5 w-full max-w-md">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 border rounded w-full text-black"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 border rounded w-full text-black"
            required
          />
          <button type="submit" className="p-2 bg-blue-500 text-white rounded">
            Login
          </button>
        </form>
        <Link href="/register" className="text-blue-500">
          Não tem uma conta? Registre-se aqui
        </Link>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center"></footer>
    </div>
  );
}
