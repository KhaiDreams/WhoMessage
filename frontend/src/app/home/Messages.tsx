"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useMatches } from "@/hooks/useMatches";
import { useChat } from "@/hooks/useChat";
import { useSocket } from "@/hooks/useSocket";
import UserProfile from "@/components/UserProfile";

interface ConversationWithMatch {
  id: number;
  matchId: number;
  otherUser: any;
  conversationId?: number;
  lastMessage?: {
    id: number;
    content: string;
    messageType: string;
    senderId: number;
    isFromMe: boolean;
    createdAt: string;
  };
  unreadCount: number;
  updatedAt: string;
}

export default function Messages() {
  const { matches, loading, error, fetchMatches } = useMatches();
  const [selected, setSelected] = useState<number | null>(null);
  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  const [profileMatchId, setProfileMatchId] = useState<number | null>(null);
  const [conversation, setConversation] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevConversationsRef = useRef<ConversationWithMatch[]>([]);
  const lastMessageIdsRef = useRef<{[key: number]: number}>({});
  const [hasScrolledToUnread, setHasScrolledToUnread] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
  
  const { getOrCreateConversation, getMessages } = useChat();

  // Função para abrir perfil com informações do match
  const openProfile = (userId: number, matchId?: number) => {
    setProfileUserId(userId);
    setProfileMatchId(matchId || null);
  };

  // Função para fechar perfil
  const closeProfile = () => {
    setProfileUserId(null);
    setProfileMatchId(null);
  };

  // Função chamada quando match é removido
  const handleMatchRemoved = () => {
    // Atualiza a lista de matches
    fetchMatches();
    // Limpa a seleção atual se estava selecionada
    setSelected(null);
    setConversation(null);
  };
  const {
    connected,
    messages,
    setMessages,
    typingUsers,
    onlineUsers,
    isUserOnline,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    unreadCount,
    conversations,
    setConversations,
    socket
  } = useSocket();

  // Memoized conversations with matches data
  const conversationsWithMatches = useMemo(() => {
    if (matches.length === 0) return [];
    
    const result = matches.map(match => {
      const socketConv = conversations.find(c => c.chatPartner.id === match.otherUser.id);
      const matchUnreadCount = unreadCounts[match.id] || 0;
      
      return {
        id: match.id, // Use match ID for consistency
        matchId: match.id,
        otherUser: match.otherUser,
        conversationId: socketConv?.id, // Store real conversation ID separately
        lastMessage: socketConv?.lastMessage,
        unreadCount: matchUnreadCount, // Use local state for unread count
        updatedAt: socketConv?.updatedAt || match.matched_at
      };
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    return result;
  }, [matches, conversations, unreadCounts]);

  // Auto-scroll logic
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToFirstUnread = () => {
    // For now, just scroll to bottom. Can be enhanced later with unread message detection
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  // Scroll management
  useEffect(() => {
    if (messages.length > 0) {
      if (!hasScrolledToUnread) {
        scrollToFirstUnread();
        setHasScrolledToUnread(true);
      } else {
        scrollToBottom();
      }
    }
  }, [messages, hasScrolledToUnread]);

  // Handle new messages for unread count and notifications
  useEffect(() => {
    if (conversationsWithMatches.length > 0) {
      conversationsWithMatches.forEach(conv => {
        if (conv.lastMessage && !conv.lastMessage.isFromMe) {
          // Use a more reliable way to track new messages
          const lastKnownMessageId = lastMessageIdsRef.current[conv.id];
          const isNewMessage = lastKnownMessageId !== conv.lastMessage.id;
          
          if (isNewMessage) {
            // Update the last known message ID first
            lastMessageIdsRef.current[conv.id] = conv.lastMessage.id;
            
            // Only process as new if we had a previous message ID (avoid initial load notifications)
            if (lastKnownMessageId !== undefined) {
              
              // If it's not the currently selected conversation, increment unread count
              if (selected !== conv.id) {
                setUnreadCounts(prev => {
                  const newCounts = {
                    ...prev,
                    [conv.id]: (prev[conv.id] || 0) + 1
                  };
                  return newCounts;
                });
                
                // Show notification
                if (Notification.permission === 'granted') {
                  new Notification(`Nova mensagem de ${conv.otherUser.username}`, {
                    body: conv.lastMessage.content.length > 50 
                      ? conv.lastMessage.content.substring(0, 50) + '...'
                      : conv.lastMessage.content,
                    icon: conv.otherUser.pfp || '/favicon.ico',
                    tag: `message-${conv.id}`,
                  });
                }
              }
            }
          }
        } else if (conv.lastMessage) {
          // Always update lastMessageId even for own messages to keep tracking in sync
          lastMessageIdsRef.current[conv.id] = conv.lastMessage.id;
        }
      });
    }
    
    // Keep the old ref for backward compatibility
    prevConversationsRef.current = conversationsWithMatches;
  }, [conversationsWithMatches, selected]);

  // Request notification permission on mount and set up periodic sync
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Force sync conversations every 30 seconds to ensure data is fresh
    const syncInterval = setInterval(() => {
      if (connected && socket) {
        socket.emit('get_conversations');
      }
    }, 30000); // 30 seconds
    
    return () => {
      clearInterval(syncInterval);
    };
  }, [connected, socket]);
  
  const handleSelectMatch = async (matchId: number) => {
    const matchData = conversationsWithMatches.find(c => c.id === matchId);
    if (!matchData) {
      return;
    }
    
    try {
      // Sair da conversa anterior se houver
      if (conversation) {
        leaveConversation(conversation.id);
      }
      
      let conversationId = matchData.conversationId;
      
      // Se não tem conversa ainda, criar uma
      if (!conversationId) {
        const { conversation: newConv } = await getOrCreateConversation(matchData.otherUser.id);
        conversationId = newConv.id;
      }
      
      // Set selected and conversation
      setSelected(matchId);
      setConversation({ 
        id: conversationId, 
        otherUser: matchData.otherUser 
      });
      setHasScrolledToUnread(false); // Reset scroll state
      
      // Clear messages first to avoid showing old messages
      setMessages([]);
      
      // Entrar na conversa
      joinConversation(conversationId);
      
      // Carregar mensagens
      const { messages: messagesList } = await getMessages(conversationId);
      setMessages(messagesList);
      
      // Mark messages as read
      markAsRead(conversationId);
      
      // Clear unread count for this match
      setUnreadCounts(prev => {
        const newCounts = {
          ...prev,
          [matchId]: 0
        };
        return newCounts;
      });
      
    } catch (err) {
      console.error('💥 Erro ao abrir conversa:', err);
    }
  };

  const handleSendMessage = (content: string) => {
    if (!conversation) return;
    sendMessage(conversation.id, content);
    // Scroll to bottom after sending
    setTimeout(() => scrollToBottom(), 100);
  };

  const handleStartTyping = () => {
    if (!conversation) return;
    startTyping(conversation.id);
  };

  const handleStopTyping = () => {
    if (!conversation) return;
    stopTyping(conversation.id);
  };

  const selectedConversation = conversationsWithMatches.find(c => c.id === selected);

  // Calculate total unread messages
  const totalUnreadMessages = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Carregando seus matches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Erro ao carregar matches</p>
          <button 
            onClick={() => fetchMatches()}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">�</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Nenhum match ainda</h2>
          <p className="text-foreground/60 mb-4">Continue usando o swipe para encontrar alguém especial!</p>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-foreground/80">
              💡 <strong>Dica:</strong> Quando vocês se curtirem mutuamente, aparecerá um match aqui e poderão conversar!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full max-w-6xl mx-auto p-2 md:p-0">
      {/* Profile Modal */}
      {profileUserId && (
        <UserProfile 
          userId={profileUserId}
          matchId={profileMatchId || undefined}
          onClose={closeProfile}
          onMatchRemoved={handleMatchRemoved}
        />
      )}
      
      <div className="flex h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] bg-card/80 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden border border-card-border">
        {/* Lista de conversas */}
        <div className={`w-full md:w-1/3 border-r border-card-border overflow-y-auto ${selected ? 'hidden md:block' : 'block'}`}>
          <div className="p-3 md:p-4 border-b border-card-border bg-card/90 flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-bold text-foreground">Conversas ({conversationsWithMatches.length})</h2>
            {totalUnreadMessages > 0 && (
              <div className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] flex items-center justify-center">
                {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
              </div>
            )}
          </div>
          {conversationsWithMatches.length === 0 ? (
            <div className="p-4 text-center">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-foreground/60 text-sm">Nenhuma conversa ainda</p>
            </div>
          ) : (
            conversationsWithMatches.map(conv => (
              <div
                key={`conv-${conv.id}-${conv.matchId}`}
                className={`flex items-center gap-3 p-3 md:p-4 border-b border-card-border/30 ${
                  selected === conv.id ? 'bg-primary/20 border-r-2 border-primary' : ''
                }`}
              >
                {/* Profile Picture - Clickable for Profile */}
                <div className="relative flex-shrink-0">
                  <div 
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center text-lg md:text-xl border border-primary/20 cursor-pointer hover:scale-105 transition-transform hover:border-primary/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      openProfile(conv.otherUser.id, conv.matchId);
                    }}
                    title={`Ver perfil de ${conv.otherUser.username}`}
                  >
                    {conv.otherUser.pfp ? (
                      <img 
                        src={conv.otherUser.pfp} 
                        alt={conv.otherUser.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      '🎮'
                    )}
                  </div>
                  
                  {/* Status online/offline */}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card ${
                    isUserOnline(conv.otherUser.id) 
                      ? 'bg-green-500' 
                      : 'bg-gray-400'
                  }`} title={isUserOnline(conv.otherUser.id) ? 'Online' : 'Offline'}></div>
                </div>
                
                {/* Main conversation area - Clickable for Chat */}
                <div 
                  className="flex-1 min-w-0 cursor-pointer hover:bg-primary/5 rounded-lg p-2 -m-2 transition-colors"
                  onClick={() => {
                    handleSelectMatch(conv.id);
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    {/* Username - Also clickable for profile */}
                    <div 
                      className="font-semibold text-foreground hover:text-primary cursor-pointer transition-colors text-sm md:text-base truncate"
                      onClick={(e) => {
                        e.stopPropagation();
                        openProfile(conv.otherUser.id, conv.matchId);
                      }}
                      title={`Ver perfil de ${conv.otherUser.username}`}
                    >
                      {conv.otherUser.username}
                    </div>
                    
                    {/* Badge de mensagens não lidas */}
                    {conv.unreadCount > 0 && (
                      <div className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full min-w-[18px] flex items-center justify-center">
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </div>
                    )}
                  </div>
                  
                  {/* Última mensagem e timestamp */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Check if someone is typing */}
                      {conv.conversationId && typingUsers.find(t => t.conversationId === conv.conversationId) ? (
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <p className="text-xs text-primary italic">
                            {typingUsers.find(t => t.conversationId === conv.conversationId)?.username} digitando...
                          </p>
                        </div>
                      ) : conv.lastMessage ? (
                        <div className="flex items-center gap-1">
                          {conv.lastMessage.isFromMe && (
                            <div className="flex-shrink-0">
                              {/* Placeholder for read status - will be enhanced later */}
                              <div className="text-blue-500" title="Enviada">✓</div>
                            </div>
                          )}
                          <p className={`text-xs truncate ${
                            conv.unreadCount > 0 && !conv.lastMessage.isFromMe
                              ? 'text-foreground font-medium'
                              : 'text-foreground/60'
                          }`}>
                            {conv.lastMessage.isFromMe ? 'Você: ' : ''}
                            {conv.lastMessage.messageType === 'image' 
                              ? '📷 Imagem' 
                              : conv.lastMessage.messageType === 'file'
                              ? '📎 Arquivo'
                              : conv.lastMessage.content}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-foreground/40">Conversa iniciada</p>
                      )}
                    </div>
                    
                    <div className="text-xs text-foreground/40 flex-shrink-0 ml-2">
                      {conv.lastMessage ? (
                        (() => {
                          const messageDate = new Date(conv.lastMessage.createdAt);
                          const now = new Date();
                          const diffInMs = now.getTime() - messageDate.getTime();
                          const diffInHours = diffInMs / (1000 * 60 * 60);
                          const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
                          
                          if (diffInHours < 1) {
                            const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
                            return diffInMinutes < 1 ? 'agora' : `${diffInMinutes}min`;
                          } else if (diffInHours < 24) {
                            return messageDate.toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            });
                          } else if (diffInDays < 7) {
                            return messageDate.toLocaleDateString('pt-BR', { weekday: 'short' });
                          } else {
                            return messageDate.toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: '2-digit' 
                            });
                          }
                        })()
                      ) : (
                        new Date(conv.updatedAt).toLocaleDateString('pt-BR', { 
                          day: '2-digit', 
                          month: '2-digit' 
                        })
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Mobile arrow indicator */}
                <div className="md:hidden text-foreground/40 flex-shrink-0">
                  →
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Chat - Responsivo para mobile */}
        <div className={`flex-1 flex-col justify-between bg-card/60 ${selected ? 'flex' : 'hidden md:flex'}`}>
          {selected && selectedConversation ? (
            <>
              <div className="p-3 md:p-4 border-b border-card-border bg-card/90 flex items-center gap-3">
                <button 
                  onClick={() => setSelected(null)}
                  className="md:hidden text-primary hover:bg-primary/10 p-2 rounded-full transition-colors flex-shrink-0"
                  title="Voltar para lista"
                >
                  ←
                </button>
                <div className="relative flex-shrink-0">
                  <div 
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center border border-primary/20 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => openProfile(selectedConversation.otherUser.id, selectedConversation.matchId)}
                    title={`Ver perfil de ${selectedConversation.otherUser.username}`}
                  >
                    {selectedConversation.otherUser.pfp ? (
                      <img 
                        src={selectedConversation.otherUser.pfp} 
                        alt={selectedConversation.otherUser.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      '🎮'
                    )}
                  </div>
                  
                  {/* Status online/offline no header */}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
                    isUserOnline(selectedConversation.otherUser.id) 
                      ? 'bg-green-500' 
                      : 'bg-gray-400'
                  }`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div 
                    className="font-semibold text-foreground hover:text-primary cursor-pointer transition-colors text-sm md:text-base truncate"
                    onClick={() => openProfile(selectedConversation.otherUser.id, selectedConversation.matchId)}
                    title={`Ver perfil de ${selectedConversation.otherUser.username}`}
                  >
                    {selectedConversation.otherUser.username}
                  </div>
                  <div className="text-xs md:text-sm flex items-center gap-2">
                    <span className={isUserOnline(selectedConversation.otherUser.id) ? 'text-green-400' : 'text-gray-400'}>
                      {isUserOnline(selectedConversation.otherUser.id) ? 'Online' : 'Offline'}
                    </span>
                    <span className="text-foreground/40">•</span>
                    <span className="text-foreground/40">
                      Conversa desde {new Date(selectedConversation.updatedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages area - Chat simples integrado */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {connected ? (
                  <>
                    {/* Área das mensagens */}
                    <div 
                      ref={messagesContainerRef}
                      className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-br from-background/50 to-background/30"
                    >
                      {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="text-4xl mb-3">💬</div>
                            <p className="text-foreground/60">Início da conversa</p>
                            <p className="text-sm text-foreground/40 mt-1">Envie a primeira mensagem!</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          {messages.map((message, index) => (
                            <div key={`${message.id}-${index}`} className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'} group`}>
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                                  message.isFromMe
                                    ? 'bg-gradient-to-r from-primary to-primary/90 text-white rounded-br-sm'
                                    : 'bg-card border border-card-border text-foreground rounded-bl-sm'
                                }`}
                              >
                                {/* Message content */}
                                <div className="space-y-1">
                                  {message.messageType === 'image' ? (
                                    <div className="text-sm">📷 Imagem</div>
                                  ) : message.messageType === 'file' ? (
                                    <div className="text-sm">📎 Arquivo</div>
                                  ) : (
                                    <p className="text-sm leading-relaxed break-words">{message.content}</p>
                                  )}
                                  
                                  {/* Timestamp and read status */}
                                  <div className={`flex items-center justify-between text-xs mt-2 ${
                                    message.isFromMe ? 'text-white/70' : 'text-foreground/50'
                                  }`}>
                                    <span>
                                      {new Date(message.createdAt).toLocaleTimeString('pt-BR', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </span>
                                    
                                    {/* Read status for sent messages */}
                                    {message.isFromMe && (
                                      <div className="ml-2 flex-shrink-0">
                                        {message.isRead ? (
                                          <div className="text-blue-300" title="Lida">✓✓</div>
                                        ) : (
                                          <div className="text-white/50" title="Enviada">✓</div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Auto-scroll target */}
                          <div ref={messagesEndRef} />
                        </>
                      )}
                      
                      {/* Indicador de digitação */}
                      {typingUsers.filter(t => conversation && t.conversationId === conversation.id).map(typingUser => (
                        <div key={typingUser.userId} className="flex justify-start">
                          <div className="bg-card border border-card-border text-foreground px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                              <span className="text-xs text-foreground/60">
                                {typingUser.username} está digitando...
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Área de input */}
                    <div className="p-4 bg-card/90 border-t border-card-border">
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                          if (input.value.trim()) {
                            handleSendMessage(input.value.trim());
                            handleStopTyping();
                            input.value = '';
                          }
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          placeholder="Digite sua mensagem..."
                          className="flex-1 px-4 py-3 rounded-lg bg-background border border-card-border text-foreground placeholder-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              return; // Let form handle submit
                            }
                            handleStartTyping();
                          }}
                          onBlur={() => {
                            handleStopTyping();
                          }}
                          onChange={(e) => {
                            if (e.target.value.length === 0) {
                              handleStopTyping();
                            }
                          }}
                        />
                        <button
                          type="submit"
                          className="px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:from-primary/90 hover:to-primary/80 transition-all font-medium shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <span className="hidden sm:inline">Enviar</span>
                          <span className="sm:hidden">📤</span>
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-foreground/60">Conectando ao chat...</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4 md:p-8">
              <div className="text-center">
                <div className="text-4xl md:text-6xl mb-2 md:mb-4">💬</div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">Selecione uma conversa</h3>
                <p className="text-sm md:text-base text-foreground/60">Escolha um match para começar a conversar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
