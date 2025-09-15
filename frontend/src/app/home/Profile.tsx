'use client';
import { useState, useEffect } from 'react';
import { userAPI, tagsAPI } from '../../lib/api';
import { User, Tag } from '../../lib/api';
import { toast } from 'react-toastify';

interface ProfileProps {
  user: User;
  userGames: Tag[];
  userInterests: Tag[];
  onProfileUpdate: () => Promise<void>;
}

function ProfileComponent({ user, userGames, userInterests, onProfileUpdate }: ProfileProps) {
  const [edit, setEdit] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [gamesList, setGamesList] = useState<Tag[]>([]);
  const [interestsList, setInterestsList] = useState<Tag[]>([]);
  const [gameSearch, setGameSearch] = useState('');
  const [interestSearch, setInterestSearch] = useState('');
  
  const [formData, setFormData] = useState({
    username: user.username,
    age: user.age,
    bio: user.bio || '',
    pfp: user.pfp || '',
    newNickname: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [selectedGames, setSelectedGames] = useState<number[]>(userGames.map(game => game.id));
  const [selectedInterests, setSelectedInterests] = useState<number[]>(userInterests.map(interest => interest.id));

  useEffect(() => {
    if (edit) {
      loadTags();
    }
  }, [edit]);

  useEffect(() => {
    setFormData({
      username: user.username,
      age: user.age,
      bio: user.bio || '',
      pfp: user.pfp || '',
      newNickname: ''
    });
    setSelectedGames(userGames.map(game => game.id));
    setSelectedInterests(userInterests.map(interest => interest.id));
  }, [user, userGames, userInterests]);

  const loadTags = async () => {
    try {
      const [gamesResponse, interestsResponse] = await Promise.all([
        tagsAPI.getGames(),
        tagsAPI.getInterests()
      ]);
      setGamesList(gamesResponse);
      setInterestsList(interestsResponse);
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
      toast.error('Erro ao carregar jogos e interesses');
    }
  };

  const filteredGames = gamesList.filter(game =>
    game.name.toLowerCase().includes(gameSearch.toLowerCase())
  );

  const filteredInterests = interestsList.filter(interest =>
    interest.name.toLowerCase().includes(interestSearch.toLowerCase())
  );

  const toggleGame = (gameId: number) => {
    setSelectedGames(prev => 
      prev.includes(gameId) 
        ? prev.filter(id => id !== gameId)
        : prev.length < 20 ? [...prev, gameId] : prev
    );
  };

  const toggleInterest = (interestId: number) => {
    setSelectedInterests(prev => 
      prev.includes(interestId) 
        ? prev.filter(id => id !== interestId)
        : prev.length < 10 ? [...prev, interestId] : prev
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, pfp: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (selectedGames.length < 3) {
      toast.error('Selecione pelo menos 3 jogos');
      return;
    }
    if (selectedInterests.length < 3) {
      toast.error('Selecione pelo menos 3 interesses');
      return;
    }

    setLoading(true);
    try {
      // Preparar dados do usuário
      const updateData: any = {
        id: user.id,
        age: formData.age,
        bio: formData.bio,
        pfp: formData.pfp
      };

      // Se há um novo nickname, adicionar ao array
      if (formData.newNickname && formData.newNickname.trim()) {
        const currentNicknames = user.nicknames || [];
        updateData.nicknames = [...currentNicknames, formData.newNickname.trim()];
      }

      await Promise.all([
        userAPI.updateProfile(updateData),
        tagsAPI.updateUserGames(selectedGames),
        tagsAPI.updateUserInterests(selectedInterests)
      ]);

      await onProfileUpdate();
      setEdit(false);
      // Limpar o campo de novo nickname
      setFormData(prev => ({ ...prev, newNickname: '' }));
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      // Trata somente como imagem muito grande quando o backend indicar claramente (evita duplicidade do "Failed to fetch")
      const isImageTooLarge =
        error?.response?.status === 413 ||
        error?.status === 413 ||
        error?.response?.data?.error === 'IMAGE_TOO_LARGE' ||
        error?.message === 'IMAGE_TOO_LARGE' ||
        (typeof error?.message === 'string' && error.message.toLowerCase().includes('payload too large'));

      if (isImageTooLarge) {
        toast.error('A imagem é muito grande. Por favor, escolha uma imagem menor.');
      } else {
        toast.error('Erro ao salvar perfil');
      }
      console.error('Erro ao salvar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('A nova senha deve ter pelo menos 8 caracteres');
      return;
    }

    const strongRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!strongRegex.test(passwordData.newPassword)) {
      toast.error('A nova senha deve conter pelo menos 1 letra maiúscula, 1 número e 1 caractere especial');
      return;
    }

    setPasswordLoading(true);
    try {
      await userAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordChange(false);
      toast.success('Senha alterada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="h-full max-w-4xl mx-auto flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border border-card-border">
        <div className="text-center">
          {/* Avatar */}
          <div className="relative mb-6 inline-block">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center text-6xl md:text-8xl border-4 border-primary/20 shadow-xl">
              {formData.pfp ? (
                <img 
                  src={formData.pfp} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                '🎮'
              )}
            </div>
            {edit && (
              <label className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary-dark transition-colors shadow-lg">
                📷
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            )}
          </div>

          {edit ? (
            <div className="space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground/70">Nome de usuário (fixo)</label>
                  <input 
                    className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-400 cursor-not-allowed" 
                    value={formData.username} 
                    disabled
                    readOnly
                    title="O nome de usuário não pode ser alterado"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground/70">Idade</label>
                  <input 
                    className="w-full px-4 py-3 rounded-lg bg-slate-900/90 border border-slate-600/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-white placeholder-slate-400 transition-all hover:border-slate-500" 
                    value={formData.age} 
                    type="number" 
                    min="14"
                    max="99"
                    onChange={e => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 18 }))}
                    placeholder="Sua idade"
                  />
                </div>
              </div>

              {/* Campo para novo nickname */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/70">
                  Nickname atual: {user.nicknames && user.nicknames.length > 0 ? user.nicknames[user.nicknames.length - 1] : 'Nenhum'}
                </label>
                <input 
                  className="w-full px-4 py-3 rounded-lg bg-slate-900/90 border border-slate-600/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-white placeholder-slate-400 transition-all hover:border-slate-500" 
                  value={formData.newNickname || ''} 
                  onChange={e => setFormData(prev => ({ ...prev, newNickname: e.target.value }))}
                  placeholder="Digite um novo nickname (opcional)"
                  maxLength={50}
                />
                {user.nicknames && user.nicknames.length > 0 && (
                  <div className="text-xs text-foreground/50">
                    Histórico de nicknames: {user.nicknames.join(', ')}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/70">Sobre mim</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-lg bg-slate-900/90 border border-slate-600/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-white placeholder-slate-400 resize-none transition-all hover:border-slate-500" 
                  value={formData.bio} 
                  onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Conte um pouco sobre você..."
                  rows={3}
                  maxLength={300}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-foreground/50">
                    {formData.bio.length}/300 caracteres
                  </span>
                </div>
              </div>

              {/* Seção de Jogos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    🎮 <span>Meus Jogos</span>
                  </h3>
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    selectedGames.length >= 3 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {selectedGames.length}/20 {selectedGames.length >= 3 ? '✓' : `(min. 3)`}
                  </span>
                </div>
                <div className="relative">
                  <input
                    className="w-full px-4 py-3 pl-10 rounded-lg bg-slate-900/90 border border-slate-600/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-white placeholder-slate-400 transition-all hover:border-slate-500"
                    placeholder="🔍 Buscar jogos..."
                    value={gameSearch}
                    onChange={(e) => setGameSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-700/50 rounded-lg p-4 bg-slate-800/30">
                  {filteredGames.map(game => (
                    <div 
                      key={game.id} 
                      className={`p-3 rounded-lg cursor-pointer transition-all border hover:scale-[1.02] ${
                        selectedGames.includes(game.id)
                          ? 'bg-primary/20 border-primary/50 shadow-lg'
                          : 'bg-slate-800/50 border-slate-600/30 hover:bg-slate-700/50 hover:border-slate-500/50'
                      }`}
                      onClick={() => toggleGame(game.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{game.name}</span>
                        {selectedGames.includes(game.id) && <span className="text-primary text-xl">✓</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seção de Interesses */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    💝 <span>Meus Interesses</span>
                  </h3>
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    selectedInterests.length >= 3 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {selectedInterests.length}/10 {selectedInterests.length >= 3 ? '✓' : `(min. 3)`}
                  </span>
                </div>
                <div className="relative">
                  <input
                    className="w-full px-4 py-3 pl-10 rounded-lg bg-slate-900/90 border border-slate-600/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-white placeholder-slate-400 transition-all hover:border-slate-500"
                    placeholder="🔍 Buscar interesses..."
                    value={interestSearch}
                    onChange={(e) => setInterestSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-700/50 rounded-lg p-4 bg-slate-800/30">
                  {filteredInterests.map(interest => (
                    <div 
                      key={interest.id} 
                      className={`p-3 rounded-lg cursor-pointer transition-all border hover:scale-[1.02] ${
                        selectedInterests.includes(interest.id)
                          ? 'bg-accent/20 border-accent/50 shadow-lg'
                          : 'bg-slate-800/50 border-slate-600/30 hover:bg-slate-700/50 hover:border-slate-500/50'
                      }`}
                      onClick={() => toggleInterest(interest.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{interest.name}</span>
                        {selectedInterests.includes(interest.id) && <span className="text-accent text-xl">✓</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleSave}
                  disabled={loading || selectedGames.length < 3 || selectedInterests.length < 3}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg transition-all duration-200 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </div>
                  ) : (
                    '💾 Salvar Alterações'
                  )}
                </button>
                <button 
                  onClick={() => setEdit(false)}
                  className="px-6 py-3 rounded-lg border border-slate-600/50 text-foreground hover:bg-slate-700/50 transition-all duration-200 font-semibold"
                >
                  ✕ Cancelar
                </button>
              </div>
            </div>
          ) : (
            /* Modo visualização */
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {user.nicknames && user.nicknames.length > 0 
                    ? user.nicknames[user.nicknames.length - 1] 
                    : formData.username}
                </h2>
                {user.nicknames && user.nicknames.length > 0 && (
                  <p className="text-sm text-foreground/60 mb-3">
                    @{formData.username}
                  </p>
                )}
                <div className="inline-flex items-center gap-2 bg-background/30 rounded-full px-4 py-2 border border-card-border/50">
                  <span className="text-foreground/60">🎂</span>
                  <span className="text-foreground font-medium">{formData.age} anos</span>
                </div>
              </div>
              
              {formData.bio && (
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    ✨ <span>Sobre mim</span>
                  </h3>
                  <p className="text-foreground/80 leading-relaxed bg-background/30 p-4 rounded-lg border border-card-border/50 italic">
                    "{formData.bio}"
                  </p>
                </div>
              )}
              
              <div className="text-left">
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                  🎮 Jogos Favoritos
                </h3>
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

              <div className="text-left">
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                  💝 Interesses
                </h3>
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
              
              <div className="text-left">
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                  🎮 Nicknames
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user.nicknames && user.nicknames.length > 0 ? (
                    user.nicknames.map((nickname, index) => (
                      <span 
                        key={index} 
                        className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm border border-primary/30 backdrop-blur-sm"
                      >
                        @{nickname}
                      </span>
                    ))
                  ) : (
                    <span className="text-foreground/60 text-sm">Nenhum nickname cadastrado</span>
                  )}
                </div>
              </div>
              
              <div className="space-y-3 pt-4">
                <button 
                  onClick={() => setEdit(true)}
                  className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg transition-all duration-200 font-semibold shadow-lg"
                >
                  ✏️ Editar perfil
                </button>
                <button 
                  onClick={() => setShowPasswordChange(true)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-all duration-200 font-semibold shadow-lg"
                >
                  🔒 Alterar senha
                </button>
                <button 
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('whomessage_tutorial_completed');
                    window.location.href = '/login';
                  }}
                  className="w-full bg-red-500/90 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors shadow-lg backdrop-blur-sm"
                >
                  🚪 Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de alterar senha */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 w-full max-w-md border border-card-border">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-foreground mb-2">🔒 Alterar Senha</h3>
              <p className="text-foreground/60 text-sm">Digite sua senha atual e a nova senha</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">Senha atual</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-card border border-card-border text-foreground placeholder-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Digite sua senha atual"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">Nova senha</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-card border border-card-border text-foreground placeholder-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Digite a nova senha"
                />
                <p className="text-xs text-foreground/50 mt-1">
                  Mín. 8 caracteres, 1 maiúscula, 1 número, 1 especial
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">Confirmar nova senha</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-card border border-card-border text-foreground placeholder-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Confirme a nova senha"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handlePasswordChange}
                  disabled={passwordLoading}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg transition-all duration-200 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Alterando...
                    </div>
                  ) : (
                    '✓ Alterar'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordChange(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="px-6 py-3 rounded-lg border border-card-border text-foreground hover:bg-card/50 transition-all duration-200 font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente wrapper que carrega os dados
export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [userGames, setUserGames] = useState<Tag[]>([]);
  const [userInterests, setUserInterests] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [userResponse, gamesResponse, interestsResponse, allGames, allInterests] = await Promise.all([
        userAPI.getProfile(),
        tagsAPI.getUserGames(),
        tagsAPI.getUserInterests(),
        tagsAPI.getGames(),
        tagsAPI.getInterests()
      ]);

      // A API /api/user/me retorna { user: {...} }
      setUser(userResponse.user);

      if (gamesResponse && typeof gamesResponse === 'object' && 'pre_tag_ids' in gamesResponse && Array.isArray(gamesResponse.pre_tag_ids)) {
        const userGameIds = gamesResponse.pre_tag_ids.map(id => Number(id)); // Converter strings para números
        const userGameObjects = allGames.filter(game => {
          const match = userGameIds.includes(game.id);
          return match;
        });
        setUserGames(userGameObjects);
      } else {
        setUserGames([]);
      }

      if (interestsResponse && typeof interestsResponse === 'object' && 'pre_tag_ids' in interestsResponse && Array.isArray(interestsResponse.pre_tag_ids)) {
        const userInterestIds = interestsResponse.pre_tag_ids.map(id => Number(id)); // Converter strings para números
        const userInterestObjects = allInterests.filter(interest => {
          const match = userInterestIds.includes(interest.id);
          return match;
        });
        setUserInterests(userInterestObjects);
      } else {
        setUserInterests([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do perfil:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground/60">Erro ao carregar perfil</p>
          <button 
            onClick={loadData}
            className="mt-4 bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProfileComponent 
      user={user}
      userGames={userGames}
      userInterests={userInterests}
      onProfileUpdate={loadData}
    />
  );
}
