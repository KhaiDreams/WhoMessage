"use client";
import { useState } from "react";
import { mockMessages } from "@/lib/mockData";

export default function Messages() {
  const [selected, setSelected] = useState<number | null>(mockMessages[0]?.id || null);
  const chat = mockMessages.find(m => m.id === selected);

  return (
    <div className="h-full max-w-6xl mx-auto">
      <div className="flex h-[calc(100vh-8rem)] bg-card/80 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden border border-card-border">
        {/* Lista de conversas */}
        <div className="w-full md:w-1/3 border-r border-card-border overflow-y-auto">
          <div className="p-4 border-b border-card-border bg-card/90">
            <h2 className="text-xl font-bold text-foreground">Mensagens</h2>
          </div>
          {mockMessages.map(m => (
            <div
              key={m.id}
              className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-primary/10 transition-colors ${selected === m.id ? 'bg-primary/20 border-r-2 border-primary' : ''}`}
              onClick={() => setSelected(m.id)}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center text-xl border border-primary/20">
                🎮
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground">{m.userName}</div>
                <div className="text-sm text-foreground/60 truncate">{m.lastMessage}</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Chat - Hidden on mobile when no conversation selected */}
        <div className={`flex-1 flex-col justify-between bg-card/60 ${selected ? 'flex' : 'hidden md:flex'}`}>
          {selected && chat ? (
            <>
              <div className="p-4 border-b border-card-border bg-card/90 flex items-center gap-3">
                <button 
                  onClick={() => setSelected(null)}
                  className="md:hidden text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
                >
                  ←
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center border border-primary/20">
                  🎮
                </div>
                <div>
                  <div className="font-semibold text-foreground">{chat.userName}</div>
                  <div className="text-xs text-green-400">Online</div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chat.messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`px-4 py-2 rounded-2xl max-w-xs lg:max-w-md ${msg.fromMe ? 'bg-primary text-white' : 'bg-card border border-card-border text-foreground'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              
              <form className="flex gap-2 p-4 border-t border-card-border bg-card/90">
                <input 
                  type="text" 
                  className="flex-1 rounded-full px-4 py-3 bg-slate-900/90 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all hover:border-slate-500" 
                  placeholder="Digite uma mensagem..." 
                  disabled 
                />
                <button 
                  type="submit" 
                  className="bg-primary text-white px-6 py-3 rounded-full hover:bg-primary-dark transition-colors shadow-lg" 
                  disabled
                >
                  Enviar
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-foreground/50">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <p>Selecione uma conversa para começar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
