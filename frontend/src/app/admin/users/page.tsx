"use client";
import { useEffect, useState } from "react";
import useAuth from "../../../hooks/useAuth";
import { adminAPI, type User, type AdminUsersResponse } from "../../../lib/api";
import { toast } from "react-toastify";

interface FilterOptions {
  status: string;
  search: string;
  page: number;
}

export default function AdminUsersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminUsersResponse['stats'] | null>(null);
  const [pagination, setPagination] = useState<AdminUsersResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: '',
    search: '',
    page: 1
  });
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [searchInput, setSearchInput] = useState('');

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

  const fetchUsers = async (showFullLoading = true) => {
    if (isFetching) return;
    try {
      setIsFetching(true);
      if (showFullLoading) setLoading(true);
      else setTableLoading(true);
      const response = await adminAPI.getUsers(
        filters.status || undefined,
        filters.search || undefined,
        filters.page,
        20
      );
      setUsers(response.users);
      setPagination(response.pagination);
      setStats(response.stats);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      if (showFullLoading) setLoading(false);
      else setTableLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (user?.is_admin) {
      fetchUsers(true);
    }
  }, [user, filters.status, filters.page]);

  useEffect(() => {
    if (user?.is_admin) {
      fetchUsers(false);
    }
  }, [filters.search]);

  useEffect(() => {
    if (user?.is_admin && filters.search !== '') {
      fetchUsers(false);
    }
  }, [filters.search]);

  useEffect(() => {
    if (user?.is_admin) {
      fetchUsers(false);
    }
  }, [filters.search]);

  // Sync searchInput with filters.search
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const handleToggleBan = async (userId: number, currentBanStatus: boolean, username: string) => {
    const action = currentBanStatus ? 'desbanir' : 'banir';
    if (!confirm(`Tem certeza que deseja ${action} o usuário ${username}?`)) return;
    
    setActionLoading({ ...actionLoading, [userId]: true });
    try {
      await adminAPI.toggleUserBan(userId, !currentBanStatus, `Usuário ${action}ido pelo admin ${user?.username}`);
      toast.success(`Usuário ${username} foi ${action}ido com sucesso!`);
      await fetchUsers();
    } catch (error: any) {
      toast.error(`Erro ao ${action} usuário: ` + error.message);
    } finally {
      setActionLoading({ ...actionLoading, [userId]: false });
    }
  };

  const getUserStatusBadge = (user: User) => {
    if (user.ban) {
      return <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">BANIDO</span>;
    }
    if (user.is_admin) {
      return <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium">ADMIN</span>;
    }
    if (!user.active) {
      return <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-medium">INATIVO</span>;
    }
    return <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">ATIVO</span>;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchInput, page: 1 });
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
          <h1 className="text-3xl font-bold text-foreground mb-2">
            👥 Gerenciar Usuários
          </h1>
          <p className="text-foreground/70">
            Visualize e gerencie todos os usuários da plataforma
          </p>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-card rounded-lg p-4 border border-card-border">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-foreground/70">Total</div>
            </div>
            <div className="bg-card rounded-lg p-4 border border-card-border">
              <div className="text-2xl font-bold text-green-500">{stats.active}</div>
              <div className="text-sm text-foreground/70">Ativos</div>
            </div>
            <div className="bg-card rounded-lg p-4 border border-card-border">
              <div className="text-2xl font-bold text-red-500">{stats.banned}</div>
              <div className="text-sm text-foreground/70">Banidos</div>
            </div>
            <div className="bg-card rounded-lg p-4 border border-card-border">
              <div className="text-2xl font-bold text-gray-500">{stats.inactive}</div>
              <div className="text-sm text-foreground/70">Inativos</div>
            </div>
            <div className="bg-card rounded-lg p-4 border border-card-border">
              <div className="text-2xl font-bold text-purple-500">{stats.admins}</div>
              <div className="text-sm text-foreground/70">Admins</div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-card rounded-lg p-4 border border-card-border mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-1">
                Status:
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="px-3 py-2 bg-card border border-card-border rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">Todos</option>
                <option value="active">Ativos</option>
                <option value="banned">Banidos</option>
                <option value="inactive">Inativos</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-foreground/90 mb-1">
                Buscar:
              </label>
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setFilters({ ...filters, search: e.target.value, page: 1 });
                  }}
                  placeholder="Nome de usuário ou email..."
                  className="flex-1 px-3 py-2 bg-card border border-card-border rounded-lg text-foreground placeholder-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </form>
            </div>
            <button 
              onClick={() => fetchUsers(true)}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="bg-card rounded-lg border border-card-border overflow-hidden relative">
          {tableLoading && (
            <div className="absolute inset-0 bg-card/50 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          {users.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">👤</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum usuário encontrado</h3>
              <p className="text-foreground/60">
                {filters.status || filters.search ? 'Não há usuários que correspondam aos filtros.' : 'Ainda não há usuários cadastrados.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-card/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">
                      Cadastro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {users.map((userItem) => (
                    <tr key={userItem.id} className="hover:bg-card/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {userItem.pfp ? (
                              <img src={userItem.pfp} alt={userItem.username} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              userItem.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {userItem.username}
                            </div>
                            <div className="text-xs text-foreground/60">
                              ID: {userItem.id} • {userItem.age} anos
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground/70">{userItem.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getUserStatusBadge(userItem)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/70">
                        {new Date(userItem.createdAt || '').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {!userItem.is_admin && (
                          <button
                            onClick={() => handleToggleBan(userItem.id, userItem.ban, userItem.username)}
                            disabled={actionLoading[userItem.id]}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                              userItem.ban
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                          >
                            {actionLoading[userItem.id] ? '...' : (userItem.ban ? '✅ Desbanir' : '🔨 Banir')}
                          </button>
                        )}
                        {userItem.is_admin && (
                          <span className="text-xs text-foreground/50">Admin protegido</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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