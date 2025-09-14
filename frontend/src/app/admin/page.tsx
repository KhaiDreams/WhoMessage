"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../../hooks/useAuth";
import { reportsAPI, adminAPI } from "../../lib/api";

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Verificar se é admin
  if (!authLoading && (!user || !user.is_admin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h1>
          <p className="text-foreground/60">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Buscar estatísticas de reports e usuários
      const [reportsStats, usersStats] = await Promise.all([
        reportsAPI.getReportsStats().catch(() => ({ total_reports: 0, banned_users: 0, reports_by_status: [] })),
        adminAPI.getUsers('', '', 1, 1).catch(() => ({ stats: { total: 0, active: 0, banned: 0, admins: 0 } }))
      ]);

      setDashboardStats({
        reports: reportsStats,
        users: usersStats.stats || { total: 0, active: 0, banned: 0, admins: 0 }
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_admin) {
      fetchDashboardStats();
    }
  }, [user]);

  const adminSections = [
    {
      title: "👥 Usuários",
      description: "Gerenciar usuários da plataforma",
      route: "/admin/users",
      stats: dashboardStats?.users ? [
        { label: "Total", value: dashboardStats.users.total, color: "text-primary" },
        { label: "Ativos", value: dashboardStats.users.active, color: "text-green-500" },
        { label: "Banidos", value: dashboardStats.users.banned, color: "text-red-500" }
      ] : []
    },
    {
      title: "🚨 Reports",
      description: "Gerenciar reports e moderação",
      route: "/admin/reports",
      stats: dashboardStats?.reports ? [
        { label: "Total", value: dashboardStats.reports.total_reports, color: "text-primary" },
        { label: "Pendentes", value: dashboardStats.reports.reports_by_status.find((s: any) => s.status === 'pending')?.count || 0, color: "text-yellow-500" }
      ] : []
    },
    {
      title: "📝 Feedbacks",
      description: "Visualizar feedbacks dos usuários",
      route: "/admin/feedback",
      stats: []
    }
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            ⚙️ Painel Administrativo
          </h1>
          <p className="text-foreground/70">
            Bem-vindo, {user?.username}! Gerencie a plataforma WhoMessage
          </p>
        </div>

        {/* Seções Admin */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {adminSections.map((section) => (
            <div
              key={section.route}
              onClick={() => router.push(section.route)}
              className="bg-card rounded-xl p-6 border border-card-border hover:border-primary/50 transition-all cursor-pointer hover:scale-105 group"
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {section.title}
                </h3>
                <p className="text-foreground/70 text-sm">
                  {section.description}
                </p>
              </div>

              {/* Estatísticas */}
              {section.stats.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {section.stats.map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className={`text-2xl font-bold ${stat.color}`}>
                        {stat.value}
                      </div>
                      <div className="text-xs text-foreground/60">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Seta indicativa */}
              <div className="flex justify-end mt-4">
                <div className="text-primary/50 group-hover:text-primary transition-colors">
                  →
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ações Rápidas */}
        <div className="bg-card rounded-xl p-6 border border-card-border">
          <h3 className="text-xl font-bold text-foreground mb-4">🚀 Ações Rápidas</h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => router.push("/admin/users?status=banned")}
              className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 hover:bg-red-500/20 transition-colors text-left"
            >
              <div className="text-red-500 font-medium">🔨 Usuários Banidos</div>
              <div className="text-sm text-foreground/60 mt-1">
                {dashboardStats?.users?.banned || 0} usuários
              </div>
            </button>

            <button
              onClick={() => router.push("/admin/reports?status=pending")}
              className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 hover:bg-yellow-500/20 transition-colors text-left"
            >
              <div className="text-yellow-600 font-medium">⏳ Reports Pendentes</div>
              <div className="text-sm text-foreground/60 mt-1">
                {dashboardStats?.reports?.reports_by_status.find((s: any) => s.status === 'pending')?.count || 0} reports
              </div>
            </button>

            <button
              onClick={() => router.push("/admin/users?status=admin")}
              className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 hover:bg-purple-500/20 transition-colors text-left"
            >
              <div className="text-purple-500 font-medium">👑 Administradores</div>
              <div className="text-sm text-foreground/60 mt-1">
                {dashboardStats?.users?.admins || 0} admins
              </div>
            </button>

            <button
              onClick={() => window.location.reload()}
              className="bg-primary/10 border border-primary/20 rounded-lg p-4 hover:bg-primary/20 transition-colors text-left"
            >
              <div className="text-primary font-medium">🔄 Atualizar Dados</div>
              <div className="text-sm text-foreground/60 mt-1">
                Recarregar estatísticas
              </div>
            </button>
          </div>
        </div>

        {/* Link para voltar */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/home")}
            className="text-foreground/60 hover:text-foreground transition-colors"
          >
            ← Voltar para Home
          </button>
        </div>
      </div>
    </div>
  );
}