import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { LoginResponse, Round, TapResponse } from '../types';
import { logoutFx } from '../stores/auth.store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Очищаем токен и состояние через store
      logoutFx();
      // Редирект только если не на странице логина
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export const api = {
  auth: {
    login: async (username: string, password: string): Promise<LoginResponse> => {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        username,
        password,
      });
      return response.data;
    },
  },
  rounds: {
    getAll: async (): Promise<Round[]> => {
      const response = await apiClient.get<Round[]>('/rounds');
      return response.data;
    },
    getById: async (id: string): Promise<Round> => {
      const response = await apiClient.get<Round>(`/rounds/${id}`);
      return response.data;
    },
    create: async (): Promise<Round> => {
      const response = await apiClient.post<Round>('/rounds');
      return response.data;
    },
  },
  taps: {
    tap: async (roundId: string): Promise<TapResponse> => {
      const response = await apiClient.post<TapResponse>(`/rounds/${roundId}/tap`);
      return response.data;
    },
  },
};

