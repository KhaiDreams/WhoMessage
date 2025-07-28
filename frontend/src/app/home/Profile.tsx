"use client";
import { useState } from "react";
import { mockProfile } from "@/lib/mockData";


function Profile() {
  const [profile, setProfile] = useState(mockProfile);
  const [edit, setEdit] = useState(false);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age.toString());
  const [bio, setBio] = useState(profile.bio);
  const [tags, setTags] = useState(profile.tags.join(", "));
  const [interests, setInterests] = useState(profile.interests.join(", "));

  const handleSave = () => {
    setProfile({
      ...profile,
      avatar,
      name,
      age: Number(age),
      bio,
      tags: tags.split(",").map(t => t.trim()),
      interests: interests.split(",").map(i => i.trim())
    });
    setEdit(false);
  };

  const handleAvatarChange = (e: any) => {
    // Simulação de upload
    const url = URL.createObjectURL(e.target.files[0]);
    setAvatar(url);
  };

  return (
    <div className="h-full max-w-4xl mx-auto flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border border-card-border">
        <div className="text-center">
          <div className="relative mb-6 inline-block">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center text-6xl md:text-8xl border-4 border-primary/20 shadow-xl">
              🎮
            </div>
            {edit && (
              <label className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary-dark transition-colors shadow-lg">
                📷
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            )}
          </div>
        {edit ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Nome</label>
              <input 
                className="w-full px-4 py-3 rounded-lg bg-slate-900/90 border border-slate-600/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-white placeholder-slate-400 transition-all hover:border-slate-500" 
                value={name} 
                onChange={e => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Idade</label>
              <input 
                className="w-full px-4 py-3 rounded-lg bg-slate-900/90 border border-slate-600/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-white placeholder-slate-400 transition-all hover:border-slate-500" 
                value={age} 
                type="number" 
                onChange={e => setAge(e.target.value)}
                placeholder="Sua idade"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Sobre mim</label>
              <textarea 
                className="w-full px-4 py-3 rounded-lg bg-slate-900/90 border border-slate-600/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-white placeholder-slate-400 resize-none transition-all hover:border-slate-500" 
                value={bio} 
                onChange={e => setBio(e.target.value)}
                placeholder="Conte um pouco sobre você..."
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Jogos (separados por vírgula)</label>
              <input 
                className="w-full px-4 py-3 rounded-lg bg-slate-900/90 border border-slate-600/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-white placeholder-slate-400 transition-all hover:border-slate-500" 
                value={tags} 
                onChange={e => setTags(e.target.value)} 
                placeholder="League of Legends, Valorant, CS2..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Interesses (separados por vírgula)</label>
              <input 
                className="w-full px-4 py-3 rounded-lg bg-slate-900/90 border border-slate-600/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-white placeholder-slate-400 transition-all hover:border-slate-500" 
                value={interests} 
                onChange={e => setInterests(e.target.value)} 
                placeholder="Anime, Música, Filmes..."
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button 
                className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors shadow-lg" 
                onClick={handleSave}
              >
                💾 Salvar
              </button>
              <button 
                className="flex-1 bg-background/80 text-foreground py-3 rounded-lg font-semibold hover:bg-background/60 transition-colors border border-card-border" 
                onClick={() => setEdit(false)}
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{profile.name}, {profile.age}</h2>
              <p className="text-foreground/80 text-center leading-relaxed bg-background/30 p-4 rounded-lg border border-card-border/50">{profile.bio}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center justify-center">
                🎮 Jogos Favoritos
              </h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {profile.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm border border-primary/30 backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center justify-center">
                ⭐ Interesses
              </h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {profile.interests.map(interest => (
                  <span 
                    key={interest} 
                    className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm border border-accent/30 backdrop-blur-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="space-y-3 pt-4">
              <button 
                className="w-full bg-primary/90 text-white py-3 rounded-lg font-semibold hover:bg-primary transition-colors shadow-lg backdrop-blur-sm" 
                onClick={() => setEdit(true)}
              >
                ✏️ Editar perfil
              </button>
              <button 
                onClick={() => {
                  // Remove token de autenticação e outros dados sensíveis
                  localStorage.removeItem('token');
                  localStorage.removeItem('whomessage_tutorial_completed');
                  // (Opcional) Limpar outros dados do usuário, se houver
                  // Redireciona para login
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
    </div>
  );
}

export default Profile;
