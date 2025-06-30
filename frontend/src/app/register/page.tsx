"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    bio: "",
    age: "",
    nickname: "", // Nickname atual/ativo
    active: true,
    is_admin: false,
    ban: false,
  });

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Se o usuário não definiu um nickname, usar o username como padrão
      const nicknameToUse = formData.nickname.trim() || formData.username;

      const res = await api.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        email: formData.email,
        password: formData.password,
        username: formData.username,
        bio: formData.bio,
        age: parseInt(formData.age),
        nicknames: [nicknameToUse],
        active: formData.active,
        is_admin: formData.is_admin,
        ban: formData.ban,
      });
      if (res.token) {
        localStorage.setItem('token', res.token);
      }
      router.push('/choose-interests');
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
          <input
            type="text"
            name="username"
            placeholder="Nome de usuário (único)"
            value={formData.username}
            onChange={handleChange}
            className="px-4 py-3 rounded-lg bg-input-bg border border-input-border text-input-text placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-input-focus transition-all duration-200"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="px-4 py-3 rounded-lg bg-input-bg border border-input-border text-input-text placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-input-focus transition-all duration-200"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Senha"
            value={formData.password}
            onChange={handleChange}
            className="px-4 py-3 rounded-lg bg-input-bg border border-input-border text-input-text placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-input-focus transition-all duration-200"
            required
          />
          <input
            type="number"
            name="age"
            placeholder="Idade"
            value={formData.age}
            onChange={handleChange}
            className="px-4 py-3 rounded-lg bg-input-bg border border-input-border text-input-text placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-input-focus transition-all duration-200"
            required
          />
          
          {/* Campo de Nickname */}
          <input
            type="text"
            name="nickname"
            placeholder="Como as pessoas vão te chamar"
            value={formData.nickname}
            onChange={handleChange}
            className="px-4 py-3 rounded-lg bg-input-bg border border-input-border text-input-text placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-input-focus transition-all duration-200"
          />

          <textarea
            name="bio"
            placeholder="Bio (opcional)"
            value={formData.bio}
            onChange={handleChange}
            className="px-4 py-3 rounded-lg bg-input-bg border border-input-border text-input-text placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-input-focus transition-all duration-200 resize-none"
            rows={3}
          />
          <button
            type="submit"
            className="w-full py-3 rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-700 to-indigo-700 text-white font-bold shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-200 ease-in-out tracking-wide text-lg border-none outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          >
            <span className="flex items-center justify-center gap-2">
              {/* Novo ícone: bonequinho com cabeça reta */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7.5" r="4" fill="#fff" stroke="#fff"/><ellipse cx="12" cy="16.5" rx="7" ry="4.5" fill="#fff" stroke="#fff"/><circle cx="12" cy="7.5" r="2" fill="#6366f1" stroke="#6366f1"/></svg>
              Cadastrar
            </span>
          </button>
        </form>
        <p className="text-sm text-foreground/70 text-center mt-2">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-primary hover:underline font-semibold transition-colors">Entrar</Link>
        </p>
      </main>
    </div>
  );
}
