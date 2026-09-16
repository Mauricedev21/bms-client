import axios, { AxiosError } from 'axios';
import { TOKEN_KEY } from './types';

export const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      const path = window.location.pathname;
      const hasToken = Boolean(localStorage.getItem(TOKEN_KEY));
      if (hasToken && path !== '/login' && path !== '/portal/login' && !path.startsWith('/register')) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string; details?: unknown } } | undefined;
    if (data?.error?.message) return data.error.message;
    if (error.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the backend running?';
    return error.message;
  }
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function errorDetails(error: unknown): unknown {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { error?: { details?: unknown } })?.error?.details;
  }
  return undefined;
}