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
