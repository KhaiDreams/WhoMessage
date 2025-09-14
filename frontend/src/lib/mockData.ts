// Mock data for users, messages, and profile
export const mockUsers = [
  {
    id: 1,
    name: 'Ana',
    age: 23,
    bio: 'Gamer e fã de RPG',
    avatar: '/assets/avatar1.png',
    tags: ['RPG', 'FPS', 'Aventura'],
    interests: ['Anime', 'Música', 'Café']
  },
  {
    id: 2,
    name: 'Lucas',
    age: 27,
    bio: 'Streamer nas horas vagas',
    avatar: '/assets/avatar2.png',
    tags: ['MOBA', 'Indie'],
    interests: ['Cinema', 'Séries']
  },
  {
    id: 3,
    name: 'Marina',
    age: 21,
    bio: 'Amo jogos cooperativos',
    avatar: '/assets/avatar3.png',
    tags: ['Coop', 'Puzzle'],
    interests: ['Livros', 'Viagens']
  }
];

export const mockMessages = [
  {
    id: 1,
    userId: 2,
    userName: 'Lucas',
    userAvatar: '/assets/avatar2.png',
    lastMessage: 'Vamos jogar hoje?',
    messages: [
      { fromMe: false, text: 'Oi! Tudo bem?' },
      { fromMe: true, text: 'Tudo sim! E você?' },
      { fromMe: false, text: 'Vamos jogar hoje?' }
    ]
  },
  {
    id: 2,
    userId: 3,
    userName: 'Marina',
    userAvatar: '/assets/avatar3.png',
    lastMessage: 'Adorei te conhecer!',
    messages: [
      { fromMe: false, text: 'Adorei te conhecer!' }
    ]
  }
];

export const mockProfile = {
  name: 'Você',
  age: 25,
  bio: 'Apaixonado por games e tecnologia',
  avatar: '/assets/avatar1.png',
  tags: ['RPG', 'FPS'],
  interests: ['Anime', 'Música']
};
