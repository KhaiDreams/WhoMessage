"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthToken } from "@/hooks/useLocalStorage";

export default function Home() {
  const router = useRouter();
  const [token, , isTokenLoading] = useAuthToken();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isTokenLoading && token) {
      router.replace('/home');
    }
  }, [router, token, isTokenLoading, isMounted]);

  // Evita flash de conteúdo durante hydration
  if (!isMounted || isTokenLoading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-8 bg-background text-foreground p-6">
      <Image
        className="white:invert mb-2"
        src="/assets/logo-removebg-preview.png"
        alt="WhoMessage Logo"
        width={220}
        height={40}
        priority
        unoptimized
      />
      <h1 className="text-4xl font-bold mb-6 text-center">
        Bem-vindo ao WhoMessage!
      </h1>
      <div className="flex gap-6 w-full max-w-md justify-center">
        <Link
          href="/login"
          className="flex-1 py-3 rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-700 to-indigo-700 text-white font-bold shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-200 ease-in-out tracking-wide text-lg border-none outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 text-center"
        >
          <span className="flex items-center justify-center gap-2">
            <svg
              width="22"
              height="22"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="inline-block"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
            Login
          </span>
        </Link>
        <Link
          href="/register"
          className="flex-1 py-3 rounded-full bg-gradient-to-r from-indigo-700 via-fuchsia-700 to-pink-600 text-white font-bold shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-200 ease-in-out tracking-wide text-lg border-none outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-center"
        >
          <span className="flex items-center justify-center gap-2">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="7.5" r="4" fill="#fff" stroke="#fff" />
              <ellipse
                cx="12"
                cy="16.5"
                rx="7"
                ry="4.5"
                fill="#fff"
                stroke="#fff"
              />
              <circle cx="12" cy="7.5" r="2" fill="#6366f1" stroke="#6366f1" />
            </svg>
            Registrar
          </span>
        </Link>
      </div>
    </main>
  );
}
