"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { userAPI } from "@/lib/api";
import { Settings, LayoutDashboard, Users, Flag, FileText } from 'lucide-react';

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
        className="bg-gradient-to-r from-indigo-700 to-pink-600 text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-all font-bold flex items-center gap-2"
        onClick={() => setShowMenu(!showMenu)}
      >
        <Settings className="w-4 h-4" /> Painel Admin
      </button>

      {showMenu && (
        <div className="absolute top-full mt-2 right-0 bg-card border border-card-border rounded-lg shadow-xl z-50 min-w-[200px]">
          <div className="py-2">
            <button
              className="w-full text-left px-4 py-2 hover:bg-card/80 transition-colors text-foreground border-b border-card-border flex items-center gap-2"
              onClick={() => {
                router.push("/admin");
                setShowMenu(false);
              }}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard Admin
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-card/80 transition-colors text-foreground flex items-center gap-2"
              onClick={() => {
                router.push("/admin/users");
                setShowMenu(false);
              }}
            >
              <Users className="w-4 h-4" /> Usuários
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-card/80 transition-colors text-foreground flex items-center gap-2"
              onClick={() => {
                router.push("/admin/reports");
                setShowMenu(false);
              }}
            >
              <Flag className="w-4 h-4" /> Reports
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-card/80 transition-colors text-foreground flex items-center gap-2"
              onClick={() => {
                router.push("/admin/feedback");
                setShowMenu(false);
              }}
            >
              <FileText className="w-4 h-4" /> Feedbacks
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
