'use client';
import { useState, useEffect } from 'react';
import { userAPI, tagsAPI, reportsAPI, interactionsAPI } from '../lib/api';
import { User, Tag } from '../lib/api';
import { toast } from 'react-toastify';

interface UserProfileProps {
  userId: number;
  isOwnProfile?: boolean;
  matchId?: number; // ID do match se existir
  onClose: () => void;
  onMatchRemoved?: () => void; // Callback para quando match é removido
}

interface ReportModalProps {
  user: User;
  onClose: () => void;
  onSubmit: (reason: string, description: string) => void;
}

interface UnmatchModalProps {
  user: User;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const UnmatchModal = ({ user, onClose, onConfirm, isLoading }: UnmatchModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-card/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md border border-card-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-card-border/50">
          <h3 className="text-lg font-bold text-foreground">Desfazer Match</h3>
          <button 
            onClick={onClose}
            className="text-foreground/60 hover:text-foreground hover:bg-foreground/10 rounded-full p-2 transition-colors"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="text-yellow-500 text-3xl">💔</div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Tem certeza que deseja desfazer o match com <span className="text-yellow-500">{user.username}</span>?
                </p>
                <p className="text-xs text-foreground/60 mt-1">
                  Esta ação não pode ser desfeita. Vocês não poderão mais conversar.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm text-foreground/80 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-red-400">•</span>
              <span>O chat será encerrado permanentemente</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-400">•</span>
              <span>{user.username} será notificado sobre o unmatch</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-400">•</span>
              <span>Vocês precisarão se curtir novamente para fazer um novo match</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Desfazendo...
                </>
              ) : (
                'Confirmar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportModal = ({ user, onClose, onSubmit }: ReportModalProps) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportReasons = [
    'Comportamento inapropriado',
    'Assédio ou bullying',
    'Spam ou conteúdo comercial',
    'Perfil falso',
    'Conteúdo ofensivo',
    'Outros'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      toast.error('Selecione um motivo para a denúncia');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(reason, description);
      onClose();
    } catch (error) {
      console.error('Erro ao enviar denúncia:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-card/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md border border-card-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-card-border/50">
          <h3 className="text-lg font-bold text-foreground">Denunciar usuário</h3>
          <button 
            onClick={onClose}
            className="text-foreground/60 hover:text-foreground hover:bg-foreground/10 rounded-full p-2 transition-colors"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="text-red-500 text-2xl">⚠️</div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Denunciando: <span className="text-red-500">{user.username}</span>
                </p>
                <p className="text-xs text-foreground/60">
                  Esta ação será analisada pelos administradores
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Motivo da denúncia *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 bg-input-bg border border-input-border text-input-text focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-input-focus transition-all duration-200 rounded-lg"
              required
              disabled={isSubmitting}
            >
              <option value="" className="bg-input-bg text-input-text">Selecione um motivo</option>
              {reportReasons.map((r, index) => (
                <option key={index} value={r} className="bg-input-bg text-input-text">{r}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Descrição adicional (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Forneça mais detalhes sobre o problema..."
              className="w-full p-3 bg-input-bg border border-input-border text-input-text placeholder-input-placeholder focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-input-focus transition-all duration-200 rounded-lg resize-none"
              rows={3}
              maxLength={500}
              disabled={isSubmitting}
            />
            <p className="text-xs text-foreground/60 mt-1">
              {description.length}/500 caracteres
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                'Denunciar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function UserProfile({ userId, isOwnProfile = false, matchId, onClose, onMatchRemoved }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userGames, setUserGames] = useState<Tag[]>([]);
  const [userInterests, setUserInterests] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showUnmatchModal, setShowUnmatchModal] = useState(false);
  const [unmatchLoading, setUnmatchLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      if (isOwnProfile) {
        // Se é o próprio perfil, usar a rota /api/user/me
        const [userResponse, gamesResponse, interestsResponse, allGames, allInterests] = await Promise.all([
          userAPI.getProfile(),
          tagsAPI.getUserGames(),
          tagsAPI.getUserInterests(),
          tagsAPI.getGames(),
          tagsAPI.getInterests()
        ]);

        setUser(userResponse.user);

        // Processar jogos
        if (gamesResponse && typeof gamesResponse === 'object' && 'pre_tag_ids' in gamesResponse && Array.isArray(gamesResponse.pre_tag_ids)) {
          const userGameIds = gamesResponse.pre_tag_ids.map(id => Number(id));
          const userGameObjects = allGames.filter(game => userGameIds.includes(game.id));
          setUserGames(userGameObjects);
        } else {
          setUserGames([]);
        }

        // Processar interesses
        if (interestsResponse && typeof interestsResponse === 'object' && 'pre_tag_ids' in interestsResponse && Array.isArray(interestsResponse.pre_tag_ids)) {
          const userInterestIds = interestsResponse.pre_tag_ids.map(id => Number(id));
          const userInterestObjects = allInterests.filter(interest => userInterestIds.includes(interest.id));
          setUserInterests(userInterestObjects);
        } else {
          setUserInterests([]);
        }
      } else {
        // Se é perfil de outro usuário, usar as novas rotas
        const [userResponse, gamesResponse, interestsResponse] = await Promise.all([
          userAPI.getUserById(userId),
          tagsAPI.getUserGamesByUserId(userId),
          tagsAPI.getUserInterestsByUserId(userId)
        ]);

        setUser(userResponse.user);
        setUserGames(gamesResponse.games || []);
        setUserInterests(interestsResponse.interests || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      toast.error('Erro ao carregar perfil do usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleReportSubmit = async (reason: string, description: string) => {
    if (!user) return;
    
    try {
      await reportsAPI.createReport(user.id, reason, description);
      toast.success('Denúncia enviada com sucesso! Nossa equipe irá analisar.');
      setShowReportModal(false);
    } catch (error) {
      console.error('Erro ao enviar denúncia:', error);
      // O erro já é mostrado pela API através do toast
    }
  };

  const handleUnmatch = async () => {
    if (!matchId || !user) return;
    
    setUnmatchLoading(true);
    try {
      await interactionsAPI.unmatch(matchId);
      toast.success(`Match com ${user.username} foi desfeito.`);
      setShowUnmatchModal(false);
      
      // Chama callback para atualizar lista de matches
      if (onMatchRemoved) {
        onMatchRemoved();
      }
      
      // Fecha o modal do perfil
      onClose();
    } catch (error) {
      console.error('Erro ao desfazer match:', error);
      // O erro já é mostrado pela API através do toast
    } finally {
      setUnmatchLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-card/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-card-border">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-foreground/60">Carregando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-card/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-card-border">
          <div className="text-center">
            <p className="text-foreground/60 mb-4">Erro ao carregar perfil</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={loadUserData}
                className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg transition-colors"
              >
                Tentar novamente
              </button>
              <button 
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-card-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-card-border/50">
          <h2 className="text-xl font-bold text-foreground">
            {isOwnProfile ? 'Meu Perfil' : `Perfil de ${user.username}`}
          </h2>
          <button 
            onClick={onClose}
            className="text-foreground/60 hover:text-foreground hover:bg-foreground/10 rounded-full p-2 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            {/* Avatar */}
            <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center text-6xl border-4 border-primary/20 shadow-xl mb-4">
              {user.pfp ? (
                <img 
                  src={user.pfp} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                '🎮'
              )}
            </div>

            {/* Basic Info */}
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {user.nicknames && user.nicknames.length > 0 
                ? user.nicknames[user.nicknames.length - 1] 
                : user.username}
            </h3>
            {user.nicknames && user.nicknames.length > 0 && (
              <p className="text-sm text-foreground/60 mb-3">
                @{user.username}
              </p>
            )}
            <div className="inline-flex items-center gap-2 bg-background/30 rounded-full px-4 py-2 border border-card-border/50">
              <span className="text-foreground/60">🎂</span>
              <span className="text-foreground font-medium">{user.age} anos</span>
            </div>
            {user.is_admin && (
              <div className="mt-2">
                <span className="bg-purple-500/20 text-purple-600 px-3 py-1 rounded-full text-sm border border-purple-500/30">
                  ⭐ ADMIN
                </span>
              </div>
            )}
          </div>
          
          {/* Bio */}
          {user.bio && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                ✨ <span>Sobre</span>
              </h4>
              <p className="text-foreground/80 leading-relaxed bg-background/30 p-4 rounded-lg border border-card-border/50 italic">
                "{user.bio}"
              </p>
            </div>
          )}
          
          {/* Nicknames */}
          {user.nicknames && user.nicknames.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                🎮 Nicknames
              </h4>
              <div className="flex flex-wrap gap-2">
                {user.nicknames.map((nickname, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm border border-primary/30 backdrop-blur-sm"
                  >
                    @{nickname}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Games */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              🎮 <span>Jogos Favoritos</span>
              {userGames.length > 0 && (
                <span className="text-sm text-foreground/60">({userGames.length})</span>
              )}
            </h4>
            <div className="flex flex-wrap gap-2">
              {userGames.length > 0 ? (
                userGames.map((game) => (
                  <span 
                    key={game.id} 
                    className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm border border-primary/30 backdrop-blur-sm"
                  >
                    {game.name}
                  </span>
                ))
              ) : (
                <span className="text-foreground/60 text-sm">Nenhum jogo selecionado</span>
              )}
            </div>
          </div>

          {/* Interests */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              💝 <span>Interesses</span>
              {userInterests.length > 0 && (
                <span className="text-sm text-foreground/60">({userInterests.length})</span>
              )}
            </h4>
            <div className="flex flex-wrap gap-2">
              {userInterests.length > 0 ? (
                userInterests.map((interest) => (
                  <span 
                    key={interest.id} 
                    className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm border border-accent/30 backdrop-blur-sm"
                  >
                    {interest.name}
                  </span>
                ))
              ) : (
                <span className="text-foreground/60 text-sm">Nenhum interesse selecionado</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-card-border/50">
          {isOwnProfile ? (
            <button 
              onClick={onClose}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg transition-all duration-200 font-semibold shadow-lg"
            >
              Fechar
            </button>
          ) : (
            <div className="space-y-3">
              {/* Botões de ação quando há match */}
              {matchId && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUnmatchModal(true)}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <span>💔</span>
                    Desfazer Match
                  </button>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <span>⚠️</span>
                    Denunciar
                  </button>
                </div>
              )}
              
              {/* Botão de denunciar quando não há match */}
              {!matchId && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <span>⚠️</span>
                    Denunciar
                  </button>
                  <button 
                    onClick={onClose}
                    className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg transition-all duration-200 font-semibold shadow-lg"
                  >
                    Fechar
                  </button>
                </div>
              )}

              {/* Botão fechar quando há match */}
              {matchId && (
                <button 
                  onClick={onClose}
                  className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg transition-all duration-200 font-semibold shadow-lg"
                >
                  Fechar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Unmatch Modal */}
      {showUnmatchModal && user && (
        <UnmatchModal 
          user={user}
          onClose={() => setShowUnmatchModal(false)}
          onConfirm={handleUnmatch}
          isLoading={unmatchLoading}
        />
      )}

      {/* Report Modal */}
      {showReportModal && user && (
        <ReportModal 
          user={user}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReportSubmit}
        />
      )}
    </div>
  );
}
