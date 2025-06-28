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
  }
};

export default api;
