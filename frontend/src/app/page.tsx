"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
      <h1 className="text-4xl font-bold mb-6">Bem-vindo ao WhoMessage!</h1>

      <div className="flex gap-6">
        <Link
          href="/login"
          className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:bg-blue-100 transition"
        >
          Login
        </Link>

        <Link
          href="/register"
          className="px-8 py-3 bg-transparent border-2 border-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition"
        >
          Registrar
        </Link>
      </div>
    </main>
  );
}
