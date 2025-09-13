"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { userAPI } from "@/lib/api";

export default function AdminButton() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await userAPI.getProfile();
        const user = (res as any)?.user;
        setIsAdmin(!!user && user.is_admin === true);
      } catch {
        setIsAdmin(false);
      }
    }
    checkAdmin();
  }, []);

  // still loading user info
  if (isAdmin === null) return null;

  if (!isAdmin) return null;

  return (
    <div className="relative">
      <button
        className="bg-gradient-to-r from-indigo-700 to-pink-600 text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-all font-bold"
        onClick={() => setShowMenu(!showMenu)}
      >
        ⚙️ Painel Admin
      </button>

      {showMenu && (
        <div className="absolute top-full mt-2 right-0 bg-card border border-card-border rounded-lg shadow-xl z-50 min-w-[200px]">
          <div className="py-2">
            <button
              className="w-full text-left px-4 py-2 hover:bg-card/80 transition-colors text-foreground border-b border-card-border"
              onClick={() => {
                router.push("/admin");
                setShowMenu(false);
              }}
            >
              🏠 Dashboard Admin
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-card/80 transition-colors text-foreground"
              onClick={() => {
                router.push("/admin/users");
                setShowMenu(false);
              }}
            >
              👥 Usuários
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-card/80 transition-colors text-foreground"
              onClick={() => {
                router.push("/admin/reports");
                setShowMenu(false);
              }}
            >
              🚨 Reports
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-card/80 transition-colors text-foreground"
              onClick={() => {
                router.push("/admin/feedback");
                setShowMenu(false);
              }}
            >
              📝 Feedbacks
            </button>
          </div>
        </div>
      )}

      {/* Overlay para fechar o menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
