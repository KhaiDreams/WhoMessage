// lib/api.ts
"use client";

import { toast } from "react-toastify";

type RequestOptions = RequestInit & {
  showErrorToast?: boolean;
};

export async function apiFetch<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { showErrorToast = true, ...fetchOptions } = options;

  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      const msg = data.message || data.error || "Erro inesperado.";
      if (showErrorToast) toast.error(msg);
      
      const error = new Error(msg);
      (error as any).toastShown = true;
      throw error;
    }

    return data;
  } catch (err: any) {
    if (showErrorToast && !err.toastShown) {
      toast.error(err.message || "Erro de conexão.");
    }
    throw err;
  }
}

function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

function withApiUrl(url: string) {
  if (url.startsWith('http')) return url;
  return `${process.env.NEXT_PUBLIC_API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

const api = {
  get: (url: string, options: RequestInit = {}) => {
    const token = getToken();
    const headers = token ? { ...options.headers, Authorization: `Bearer ${token}` } : options.headers;
    return apiFetch(withApiUrl(url), { ...options, method: 'GET', headers });
  },
  post: (url: string, body?: any, options: RequestInit = {}) => {
    const token = getToken();
    const headers = token ? { ...options.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { ...options.headers, 'Content-Type': 'application/json' };
    return apiFetch(withApiUrl(url), { ...options, method: 'POST', headers, body: JSON.stringify(body) });
  },
  put: (url: string, body?: any, options: RequestInit = {}) => {
    const token = getToken();
    const headers = token ? { ...options.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { ...options.headers, 'Content-Type': 'application/json' };
    return apiFetch(withApiUrl(url), { ...options, method: 'PUT', headers, body: JSON.stringify(body) });
  },
  delete: (url: string, options: RequestInit = {}) => {
    const token = getToken();
    const headers = token ? { ...options.headers, Authorization: `Bearer ${token}` } : options.headers;
    return apiFetch(withApiUrl(url), { ...options, method: 'DELETE', headers });
  }
};

// === TIPOS PARA TYPESCRIPT ===
export interface User {
  id: number;
  username: string;
  email: string;
  pfp?: string;
  bio?: string;
  age: number;
  nicknames?: string[];
  active: boolean;
  is_admin: boolean;
  ban: boolean;
}

export interface RecommendationUser {
  id: number;
  username: string;
  pfp?: string;
  bio?: string;
  age: number;
  nicknames?: string[];
  active: boolean;
  is_admin: boolean;
  ban: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommonTag {
  id: string;
  name: string;
}

export interface Matches {
  games: {
    count: number;
    common: CommonTag[];
    total: number;
  };
  interests: {
    count: number;
    common: CommonTag[];
    total: number;
  };
}

export interface Recommendation {
  user: RecommendationUser;
  compatibility: 'perfect' | 'high' | 'good' | 'medium' | 'low';
  totalScore: number;
  gameScore: number;
  interestScore: number;
  matches: Matches;
  percentage: number;
}

export interface RecommendationsResponse {
  message: string;
  stats: {
    perfect: number;
    high: number;
    good: number;
    medium: number;
    low: number;
  };
  userProfile: {
    games: number;
    interests: number;
  };
  recommendations: Recommendation[];
}

export interface Like {
  id: number;
  from_user_id: number;
  to_user_id: number;
  action: 'like' | 'pass';
  created_at: string;
  fromUser?: User;
}

export interface Match {
  id: number;
  matched_at: string;
  chat_active: boolean;
  otherUser: User;
}

export interface Notification {
  id: number;
  user_id: number;
  from_user_id?: number;
  type: 'like_received' | 'match_created' | 'new_message';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  fromUser?: User;
}

export interface Tag {
  id: number;
  name: string;
}

export interface UserTagsResponse {
  id?: number;
  user_id?: number;
  pre_tag_ids?: number[];
}

// === API FUNCTIONS ===

// Auth
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  register: (userData: { username: string; email: string; password: string; age: number; bio?: string }) => 
    api.post('/auth/register', userData),
  
  getMe: (): Promise<User> => 
    api.get('/api/user/me')
};

// Users
export const userAPI = {
  getProfile: (): Promise<{ user: User }> => 
    api.get('/api/user/me'),
  
  getUserById: (userId: number): Promise<{ user: User }> =>
    api.get(`/users/${userId}`),
  
  updateProfile: (userData: Partial<User> & { id: number }) => 
    api.put(`/users/${userData.id}`, userData),
  
  getRecommendations: (limit = 10): Promise<RecommendationsResponse> => 
    api.get(`/api/tags/recommendations?limit=${limit}`)
};

// Interactions
export const interactionsAPI = {
  likeUser: (to_user_id: number, action: 'like' | 'pass') => 
    api.post('/api/interactions/like', { to_user_id, action }),
  
  getMatches: (): Promise<Match[]> => 
    api.get('/api/matches'),
  
  getPendingLikes: (): Promise<Like[]> => 
    api.get('/api/interactions/pending-likes')
};

// Notifications
export const notificationsAPI = {
  getNotifications: (page = 1, limit = 20): Promise<{
    notifications: Notification[];
    pagination: { total: number; page: number; limit: number; pages: number };
    unreadCount: number;
  }> => 
    api.get(`/api/notifications?page=${page}&limit=${limit}`),
  
  markAsRead: (notificationId: number) => 
    api.put(`/api/notifications/${notificationId}/read`),
  
  markAllAsRead: () => 
    api.put('/api/notifications/mark-all-read')
};

// Tags
export const tagsAPI = {
  getGames: (): Promise<Tag[]> => 
    api.get('/api/tags/games'),
  
  getInterests: (): Promise<Tag[]> => 
    api.get('/api/tags/interests'),
  
  getUserGames: (): Promise<UserTagsResponse | {}> => 
    api.get('/api/tags/games-user'),
  
  getUserInterests: (): Promise<UserTagsResponse | {}> => 
    api.get('/api/tags/interests-user'),
  
  updateUserGames: (gameIds: number[]) => 
    api.post('/api/tags/games', { pre_tag_ids: gameIds }),

  updateUserInterests: (interestIds: number[]) => 
    api.post('/api/tags/interests', { pre_tag_ids: interestIds }),
  
  getUserGamesByUserId: (userId: number): Promise<{ pre_tag_ids: number[]; games: Tag[] }> => 
    api.get(`/api/tags/games-user/${userId}`),
  
  getUserInterestsByUserId: (userId: number): Promise<{ pre_tag_ids: number[]; interests: Tag[] }> => 
    api.get(`/api/tags/interests-user/${userId}`),
  
  getUserNicknames: (): Promise<string[]> => 
    api.get('/api/tags/nicknames-user'),
  
  updateUserNicknames: (nicknames: string[]) => 
    api.post('/api/tags/nicknames', { nicknames })
};

export default api;
