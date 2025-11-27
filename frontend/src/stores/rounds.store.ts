import { createStore, createEffect, sample } from 'effector';
import { api } from '../api/client';
import { Round } from '../types';

export const $rounds = createStore<Round[]>([]);

export const fetchRoundsFx = createEffect<void, Round[]>(async () => {
  return await api.rounds.getAll();
});

export const createRoundFx = createEffect<void, Round>(async () => {
  return await api.rounds.create();
});

// Обновляем rounds после загрузки
sample({
  clock: fetchRoundsFx.doneData,
  target: $rounds,
});

// Добавляем новый раунд после создания
sample({
  clock: createRoundFx.doneData,
  source: $rounds,
  fn: (rounds, newRound) => [newRound, ...rounds],
  target: $rounds,
});

