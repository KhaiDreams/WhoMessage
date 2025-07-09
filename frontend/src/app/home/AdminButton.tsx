"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function AdminButton() {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await api.get("/api/user/me");
        setIsAdmin(res.user?.is_admin === true);
      } catch {
        setIsAdmin(false);
      }
    }
    checkAdmin();
  }, []);

  if (!isAdmin) return null;

  return (
    <button
      className="bg-gradient-to-r from-indigo-700 to-pink-600 text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-all font-bold"
      onClick={() => router.push("/admin/feedback")}
    >
      Painel Admin
    </button>
  );
}
