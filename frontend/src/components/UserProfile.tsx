'use client';
import { useState, useEffect } from 'react';
import { userAPI, tagsAPI } from '../lib/api';
import { User, Tag } from '../lib/api';
import { toast } from 'react-toastify';

interface UserProfileProps {
  userId: number;
  isOwnProfile?: boolean;
  onClose: () => void;
}

export default function UserProfile({ userId, isOwnProfile = false, onClose }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userGames, setUserGames] = useState<Tag[]>([]);
  const [userInterests, setUserInterests] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

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
          <button 
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg transition-all duration-200 font-semibold shadow-lg"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
