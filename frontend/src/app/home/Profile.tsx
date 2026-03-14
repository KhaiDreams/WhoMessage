'use client';
import { useState, useEffect } from 'react';
import { userAPI, tagsAPI } from '../../lib/api';
import { User, Tag } from '../../lib/api';
import { toast } from 'react-toastify';
import { Gamepad2, Camera, Check, Heart, Cake, Sparkles, Pencil, Lock, LogOut, Save, X, AtSign } from 'lucide-react';

interface ProfileProps {
  user: User;
  userGames: Tag[];
  userInterests: Tag[];
  onProfileUpdate: () => Promise<void>;
}

function ProfileComponent({ user, userGames, userInterests, onProfileUpdate }: ProfileProps) {
  const [edit, setEdit] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [editSection, setEditSection] = useState<'info' | 'games' | 'interests'>('info');
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [gamesList, setGamesList] = useState<Tag[]>([]);
  const [interestsList, setInterestsList] = useState<Tag[]>([]);
  const [gameSearch, setGameSearch] = useState('');
  const [interestSearch, setInterestSearch] = useState('');
  
  const [formData, setFormData] = useState({
    username: user.username,
    age: String(user.age),
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
      age: String(user.age),
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

  const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error('Imagem muito grande! Escolha uma imagem menor que 2MB.');
        return;
      }
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
      const parsedAge = parseInt(formData.age);
      if (!parsedAge || parsedAge < 14 || parsedAge > 99) {
        toast.error('Idade inválida. Insira um valor entre 14 e 99.');
        setLoading(false);
        return;
      }
      const updateData: any = {
        id: user.id,
        age: parsedAge,
        bio: formData.bio,
      };

      // Só inclui pfp se o usuário realmente trocou a foto
      if (formData.pfp !== (user.pfp || '')) {
        updateData.pfp = formData.pfp;
      }

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
      <div className="min-h-full max-w-4xl mx-auto flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl p-6 border border-card-border">

        {edit ? (
          /* Modo edição — por seções */
          <div className="space-y-4">
            {/* Navegação por seções */}
            <div className="flex rounded-xl bg-background/40 border border-card-border p-1 gap-1">
              {([
                { key: 'info' as const, label: 'Perfil' },
                { key: 'games' as const, label: `Jogos (${selectedGames.length})` },
                { key: 'interests' as const, label: `Interesses (${selectedInterests.length})` },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setEditSection(key)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                    editSection === key
                      ? 'bg-primary text-white shadow'
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Seção: Perfil */}
            {editSection === 'info' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center border-4 border-primary/20 shadow-xl overflow-hidden">
                      {formData.pfp ? (
                        <img src={formData.pfp} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <Gamepad2 className="w-12 h-12 text-primary/60" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary-dark transition-colors shadow-lg">
                      <Camera className="w-4 h-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-foreground/70">Nome de usuário (fixo)</label>
                  <input
                    className="w-full px-4 py-3 rounded-lg bg-card/50 border border-card-border text-foreground/40 cursor-not-allowed"
                    value={formData.username}
                    disabled
                    readOnly
                    title="O nome de usuário não pode ser alterado"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-foreground/70">Idade</label>
                  <input
                    className="w-full px-4 py-3 rounded-lg bg-card border border-card-border focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none text-foreground placeholder-foreground/40 transition-colors"
                    value={formData.age}
                    type="number"
                    min="14"
                    max="99"
                    onChange={e => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="Sua idade"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-foreground/70">
                    Nickname
                    {user.nicknames && user.nicknames.length > 0 && (
                      <span className="ml-2 text-xs text-foreground/40">atual: @{user.nicknames[user.nicknames.length - 1]}</span>
                    )}
                  </label>
                  <input
                    className="w-full px-4 py-3 rounded-lg bg-card border border-card-border focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none text-foreground placeholder-foreground/40 transition-colors"
                    value={formData.newNickname || ''}
                    onChange={e => setFormData(prev => ({ ...prev, newNickname: e.target.value }))}
                    placeholder="Novo nickname (opcional)"
                    maxLength={50}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-foreground/70">Sobre mim</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-lg bg-card border border-card-border focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none text-foreground placeholder-foreground/40 resize-none transition-colors"
                    value={formData.bio}
                    onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Conte um pouco sobre você..."
                    rows={3}
                    maxLength={300}
                  />
                  <p className="text-xs text-foreground/40 text-right">{formData.bio.length}/300</p>
                </div>
              </div>
            )}

            {/* Seção: Jogos */}
            {editSection === 'games' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4" /> Meus Jogos
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedGames.length >= 3
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {selectedGames.length}/20 {selectedGames.length < 3 ? '(min. 3)' : '✓'}
                  </span>
                </div>
                <input
                  className="w-full px-4 py-2.5 rounded-lg bg-card border border-card-border focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none text-foreground placeholder-foreground/40 transition-colors text-sm"
                  placeholder="Buscar jogos..."
                  value={gameSearch}
                  onChange={e => setGameSearch(e.target.value)}
                />
                <div className="h-72 overflow-y-auto space-y-1.5 rounded-xl border border-card-border p-2 bg-background/20">
                  {filteredGames.map(game => (
                    <button
                      key={game.id}
                      onClick={() => toggleGame(game.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        selectedGames.includes(game.id)
                          ? 'bg-primary/20 text-primary border border-primary/40'
                          : 'text-foreground/80 hover:bg-background/60 border border-transparent'
                      }`}
                    >
                      <span>{game.name}</span>
                      {selectedGames.includes(game.id) && <Check className="w-4 h-4 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Seção: Interesses */}
            {editSection === 'interests' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Heart className="w-4 h-4" /> Meus Interesses
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedInterests.length >= 3
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {selectedInterests.length}/10 {selectedInterests.length < 3 ? '(min. 3)' : '✓'}
                  </span>
                </div>
                <input
                  className="w-full px-4 py-2.5 rounded-lg bg-card border border-card-border focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none text-foreground placeholder-foreground/40 transition-colors text-sm"
                  placeholder="Buscar interesses..."
                  value={interestSearch}
                  onChange={e => setInterestSearch(e.target.value)}
                />
                <div className="h-72 overflow-y-auto space-y-1.5 rounded-xl border border-card-border p-2 bg-background/20">
                  {filteredInterests.map(interest => (
                    <button
                      key={interest.id}
                      onClick={() => toggleInterest(interest.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        selectedInterests.includes(interest.id)
                          ? 'bg-accent/20 text-accent border border-accent/40'
                          : 'text-foreground/80 hover:bg-background/60 border border-transparent'
                      }`}
                    >
                      <span>{interest.name}</span>
                      {selectedInterests.includes(interest.id) && <Check className="w-4 h-4 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Salvar / Cancelar */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleSave}
                disabled={loading || selectedGames.length < 3 || selectedInterests.length < 3}
                className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <><Save className="w-4 h-4" /> Salvar</>
                )}
              </button>
              <button
                onClick={() => setEdit(false)}
                className="px-5 py-3 rounded-lg border border-card-border text-foreground hover:bg-background/40 transition-colors font-semibold flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
            </div>
          </div>
        ) : (
          /* Modo visualização */
          <div className="text-center space-y-6">
            <div className="relative mb-2 inline-block">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center border-4 border-primary/20 shadow-xl overflow-hidden">
                {formData.pfp ? (
                  <img
                    src={formData.pfp}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <Gamepad2 className="w-16 h-16 md:w-20 md:h-20 text-primary/60" />
                )}
              </div>
            </div>

            <div>
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
                <Cake className="w-4 h-4 text-foreground/60" />
                <span className="text-foreground font-medium">{parseInt(formData.age) || user.age} anos</span>
              </div>
            </div>

            {formData.bio && (
              <div className="text-left">
                <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> <span>Sobre mim</span>
                </h3>
                <p className="text-foreground/80 leading-relaxed bg-background/30 p-4 rounded-lg border border-card-border/50 italic">
                  "{formData.bio}"
                </p>
              </div>
            )}

            <div className="text-left">
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Gamepad2 className="w-5 h-5" /> Jogos Favoritos
              </h3>
              <div className="flex flex-wrap gap-2">
                {userGames.length > 0 ? (
                  userGames.map((game) => (
                    <span
                      key={game.id}
                      className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm border border-primary/30"
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
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5" /> Interesses
              </h3>
              <div className="flex flex-wrap gap-2">
                {userInterests.length > 0 ? (
                  userInterests.map((interest) => (
                    <span
                      key={interest.id}
                      className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm border border-accent/30"
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
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <AtSign className="w-5 h-5" /> Nicknames
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.nicknames && user.nicknames.length > 0 ? (
                  user.nicknames.map((nickname, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm border border-primary/30"
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
                onClick={() => { setEditSection('info'); setEdit(true); }}
                className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg transition-all duration-200 font-semibold shadow-lg flex items-center justify-center gap-2"
              >
                <Pencil className="w-4 h-4" /> Editar perfil
              </button>
              <button
                onClick={() => setShowPasswordChange(true)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-all duration-200 font-semibold shadow-lg flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" /> Alterar senha
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('whomessage_tutorial_completed');
                  window.location.href = '/login';
                }}
                className="w-full bg-red-500/90 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de alterar senha */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-md border border-card-border">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2"><Lock className="w-5 h-5" /> Alterar Senha</h3>
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
                    <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Alterar</span>
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
