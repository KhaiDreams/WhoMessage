"use client";
import { useEffect, useState } from "react";
import useAuth from "../../../hooks/useAuth";
import { reportsAPI, type Report, type ReportsResponse, type ReportsStatsResponse } from "../../../lib/api";
import { toast } from "react-toastify";
import { Ban, BarChart2, User, Target, ClipboardList, FileText, UserCheck, Eye, Hammer, X, CheckCircle, RefreshCw } from 'lucide-react';

interface FilterOptions {
  status: string;
  search: string;
  banned: string;
  page: number;
}

export default function AdminReportsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportsStatsResponse | null>(null);
  const [pagination, setPagination] = useState<ReportsResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: '',
    search: '',
    banned: '',
    page: 1
  });
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [searchInput, setSearchInput] = useState('');
  const [tableLoading, setTableLoading] = useState(false);

  // Verificar se é admin
  if (!authLoading && (!user || !user.is_admin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 flex justify-center"><Ban className="w-16 h-16 text-red-500" /></div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h1>
          <p className="text-foreground/60">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  const fetchReports = async (showFullLoading = true) => {
    if (isFetching) return;
    try {
      setIsFetching(true);
      if (showFullLoading) setLoading(true);
      else setTableLoading(true);
      const response = await reportsAPI.getReports(
        filters.status || undefined,
        filters.page,
        20,
        filters.search || undefined,
        filters.banned || undefined
      );
      setReports(response.reports);
      setPagination(response.pagination);
    } catch (error: any) {
      console.error('Erro ao carregar reports:', error);
      toast.error('Erro ao carregar reports');
    } finally {
      if (showFullLoading) setLoading(false);
      else setTableLoading(false);
      setIsFetching(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await reportsAPI.getReportsStats();
      setStats(statsData);
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  useEffect(() => {
    if (user?.is_admin) {
      fetchReports(true);
    }
  }, [user, filters.status, filters.banned, filters.page]);

  // Debounce para busca
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (user?.is_admin) {
        setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (user?.is_admin) {
      fetchReports(false);
    }
  }, [filters.search]);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const handleStatusChange = async (reportId: number, newStatus: string, adminNotes?: string) => {
    setActionLoading({ ...actionLoading, [`status-${reportId}`]: true });
    try {
      await reportsAPI.updateReportStatus(reportId, newStatus, adminNotes);
      toast.success('Status atualizado com sucesso!');
      await fetchReports();
      await fetchStats();
    } catch (error: any) {
      toast.error('Erro ao atualizar status: ' + error.message);
    } finally {
      setActionLoading({ ...actionLoading, [`status-${reportId}`]: false });
    }
  };

  const handleBanUser = async (reportId: number, adminNotes?: string) => {
    if (!confirm('Tem certeza que deseja banir este usuário?')) return;
    
    setActionLoading({ ...actionLoading, [`ban-${reportId}`]: true });
    try {
      await reportsAPI.banUserFromReport(reportId, adminNotes);
      toast.success('Usuário banido com sucesso!');
      await fetchReports();
      await fetchStats();
    } catch (error: any) {
      toast.error('Erro ao banir usuário: ' + error.message);
    } finally {
      setActionLoading({ ...actionLoading, [`ban-${reportId}`]: false });
    }
  };

  const handleUnbanUser = async (userId: number, adminNotes?: string) => {
    if (!confirm('Tem certeza que deseja desbanir este usuário?')) return;
    
    setActionLoading({ ...actionLoading, [`unban-${userId}`]: true });
    try {
      await reportsAPI.unbanUser(userId, adminNotes);
      toast.success('Usuário desbanido com sucesso!');
      await fetchReports();
      await fetchStats();
    } catch (error: any) {
      toast.error('Erro ao desbanir usuário: ' + error.message);
    } finally {
      setActionLoading({ ...actionLoading, [`unban-${userId}`]: false });
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-yellow-500', text: 'Pendente' },
      reviewed: { color: 'bg-blue-500', text: 'Analisado' },
      resolved: { color: 'bg-green-500', text: 'Resolvido' },
      dismissed: { color: 'bg-gray-500', text: 'Descartado' }
    };
    
    const badge = badges[status as keyof typeof badges] || badges.pending;
    
    return (
      <span className={`${badge.color} text-white px-2 py-1 rounded-full text-xs font-medium`}>
        {badge.text}
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <BarChart2 className="w-8 h-8" /> Painel de Reports
          </h1>
          <p className="text-foreground/70">
            Gerencie reports de usuários e moderação da plataforma
          </p>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-lg p-4 border border-card-border">
              <div className="text-2xl font-bold text-primary">{stats.total_reports}</div>
              <div className="text-sm text-foreground/70">Total de Reports</div>
            </div>
            <div className="bg-card rounded-lg p-4 border border-card-border">
              <div className="text-2xl font-bold text-yellow-500">
                {stats.reports_by_status.find(s => s.status === 'pending')?.count || '0'}
              </div>
              <div className="text-sm text-foreground/70">Pendentes</div>
            </div>
            <div className="bg-card rounded-lg p-4 border border-card-border">
              <div className="text-2xl font-bold text-green-500">
                {stats.reports_by_status.find(s => s.status === 'resolved')?.count || '0'}
              </div>
              <div className="text-sm text-foreground/70">Resolvidos</div>
            </div>
            <div className="bg-card rounded-lg p-4 border border-card-border">
              <div className="text-2xl font-bold text-red-500">{stats.banned_users}</div>
              <div className="text-sm text-foreground/70">Usuários Banidos</div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-card rounded-lg p-4 border border-card-border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-1">
                Status:
              </label>
              <select 
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="px-3 py-2 bg-card border border-card-border rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary w-full"
              >
                <option value="">Todos</option>
                <option value="pending">Pendente</option>
                <option value="reviewed">Analisado</option>
                <option value="resolved">Resolvido</option>
                <option value="dismissed">Descartado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-1">
                Banidos:
              </label>
              <select 
                value={filters.banned}
                onChange={(e) => setFilters({ ...filters, banned: e.target.value, page: 1 })}
                className="px-3 py-2 bg-card border border-card-border rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary w-full"
              >
                <option value="">Todos</option>
                <option value="true">Apenas Banidos</option>
                <option value="false">Não Banidos</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-foreground/90 mb-1">
                Buscar:
              </label>
              <form className="flex gap-2" onSubmit={e => e.preventDefault()}>
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Nome, email, motivo..."
                  className="flex-1 px-3 py-2 bg-card border border-card-border rounded-lg text-foreground placeholder-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </form>
            </div>
            <div className="flex items-end">
              <button 
                onClick={() => { fetchReports(true); fetchStats(); }}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors w-full"
              >
                <RefreshCw className="w-4 h-4 inline mr-1" /> Atualizar
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Reports */}
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-card rounded-lg p-8 border border-card-border text-center">
              <div className="mb-4 flex justify-center"><FileText className="w-10 h-10 text-foreground/40" /></div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum report encontrado</h3>
              <p className="text-foreground/60">
                {filters.status ? 'Não há reports com este status.' : 'Ainda não há reports na plataforma.'}
              </p>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="bg-card rounded-lg border border-card-border overflow-hidden">
                <div className="p-6">
                  {/* Header do report */}
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          Report #{report.id}
                        </h3>
                        {getStatusBadge(report.status)}
                        {report.reportedUser?.ban && (
                          <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            BANIDO
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-foreground/70">
                        {new Date(report.createdAt).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  {/* Detalhes do report */}
                  <div className="grid md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-2 flex items-center gap-1"><User className="w-4 h-4" /> Reportado por:</h4>
                      <p className="text-foreground/70">
                        {report.reporter?.username || 'Usuário desconhecido'} ({report.reporter?.email})
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2 flex items-center gap-1"><Target className="w-4 h-4" /> Usuário reportado:</h4>
                      <p className="text-foreground/70">
                        {report.reportedUser?.username || 'Usuário desconhecido'} ({report.reportedUser?.email})
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-foreground mb-2 flex items-center gap-1"><ClipboardList className="w-4 h-4" /> Motivo:</h4>
                    <p className="text-foreground/80 bg-background rounded-lg p-3 border border-card-border">
                      {report.reason}
                    </p>
                  </div>

                  {report.description && (
                    <div className="mb-4">
                      <h4 className="font-medium text-foreground mb-2 flex items-center gap-1"><FileText className="w-4 h-4" /> Descrição:</h4>
                      <p className="text-foreground/80 bg-background rounded-lg p-3 border border-card-border">
                        {report.description}
                      </p>
                    </div>
                  )}

                  {report.admin_notes && (
                    <div className="mb-4">
                      <h4 className="font-medium text-foreground mb-2 flex items-center gap-1"><UserCheck className="w-4 h-4" /> Notas do Admin:</h4>
                      <p className="text-foreground bg-card rounded-lg p-3 border border-card-border">
                        {report.admin_notes}
                      </p>
                    </div>
                  )}

                  {/* Ações */}
                  {report.status === 'pending' && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-card-border">
                      <button 
                        onClick={() => handleStatusChange(report.id, 'reviewed', 'Report analisado pelo admin')}
                        disabled={actionLoading[`status-${report.id}`]}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading[`status-${report.id}`] ? '...' : <><Eye className="w-4 h-4 inline mr-1" /> Marcar como Analisado</>}
                      </button>
                      
                      <button 
                        onClick={() => handleBanUser(report.id, 'Usuário banido devido ao report')}
                        disabled={actionLoading[`ban-${report.id}`] || report.reportedUser?.ban}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading[`ban-${report.id}`] ? '...' : <><Hammer className="w-4 h-4 inline mr-1" /> Banir Usuário</>}
                      </button>
                      
                      <button 
                        onClick={() => handleStatusChange(report.id, 'dismissed', 'Report descartado - não procede')}
                        disabled={actionLoading[`status-${report.id}`]}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading[`status-${report.id}`] ? '...' : <><X className="w-4 h-4 inline mr-1" /> Descartar</>}
                      </button>
                    </div>
                  )}

                  {/* Botão de desbanir se usuário estiver banido */}
                  {report.reportedUser?.ban && (
                    <div className="flex gap-2 pt-4 border-t border-card-border">
                      <button 
                        onClick={() => handleUnbanUser(report.reported_user_id, 'Usuário desbanido pelo admin')}
                        disabled={actionLoading[`unban-${report.reported_user_id}`]}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading[`unban-${report.reported_user_id}`] ? '...' : <><CheckCircle className="w-4 h-4 inline mr-1" /> Desbanir Usuário</>}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Paginação */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button 
              onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
              disabled={filters.page <= 1}
              className="px-4 py-2 bg-card border border-card-border rounded-lg text-foreground hover:bg-card/80 transition-colors disabled:opacity-50"
            >
              ← Anterior
            </button>
            
            <span className="px-4 py-2 bg-primary text-white rounded-lg">
              {filters.page} de {pagination.total_pages}
            </span>
            
            <button 
              onClick={() => setFilters({ ...filters, page: Math.min(pagination.total_pages, filters.page + 1) })}
              disabled={filters.page >= pagination.total_pages}
              className="px-4 py-2 bg-card border border-card-border rounded-lg text-foreground hover:bg-card/80 transition-colors disabled:opacity-50"
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}