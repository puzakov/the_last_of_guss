import { createStore, createEffect, sample } from 'effector';
import { api } from '../api/client';
import { User, LoginResponse } from '../types';

// Функция для декодирования JWT токена
function decodeJWT(token: string): { userId: string; username: string; role: string; exp?: number } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

// Функция для восстановления пользователя из токена
function restoreUserFromToken(): User | null {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return null;
  }

  const payload = decodeJWT(token);
  if (!payload) {
    localStorage.removeItem('auth_token');
    return null;
  }

  // Проверяем, не истек ли токен
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    localStorage.removeItem('auth_token');
    return null;
  }

  return {
    id: payload.userId,
    username: payload.username,
    role: payload.role as User['role'],
  };
}

// Инициализируем store из localStorage при загрузке
const initialUser = restoreUserFromToken();
export const $user = createStore<User | null>(initialUser);
export const $isAuthenticated = $user.map((user) => user !== null);

export const loginFx = createEffect<{ username: string; password: string }, LoginResponse>(
  async ({ username, password }) => {
    const response = await api.auth.login(username, password);
    localStorage.setItem('auth_token', response.token);
    return response;
  },
);

export const logoutFx = createEffect<void, void>(() => {
  localStorage.removeItem('auth_token');
});

export const checkAuthFx = createEffect<void, User | null>(() => {
  const user = restoreUserFromToken();
  return user;
});

// Обновляем user после успешного логина
sample({
  clock: loginFx.doneData,
  fn: (response) => response.user,
  target: $user,
});

// Обновляем user после проверки токена
sample({
  clock: checkAuthFx.doneData,
  target: $user,
});

// Очищаем user после логаута
sample({
  clock: logoutFx.done,
  fn: () => null,
  target: $user,
});

