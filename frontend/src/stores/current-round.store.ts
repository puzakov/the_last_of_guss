import { createStore, createEffect, sample } from 'effector';
import { api } from '../api/client';
import { Round, RoundStatus, TapResponse } from '../types';

export const $currentRound = createStore<Round | null>(null);
export const $roundStatus = createStore<RoundStatus | null>(null);
export const $timeRemaining = createStore<number>(0);
export const $myScore = createStore<number>(0);

export const fetchRoundFx = createEffect<string, Round>(async (roundId) => {
  return await api.rounds.getById(roundId);
});

export const tapFx = createEffect<string, TapResponse>(async (roundId) => {
  return await api.taps.tap(roundId);
});

export const checkRoundStatusFx = createEffect<string, RoundStatus>(async (roundId) => {
  const round = await api.rounds.getById(roundId);
  return round.status || RoundStatus.FINISHED;
});

// Обновляем текущий раунд после загрузки
sample({
  clock: fetchRoundFx.doneData,
  target: $currentRound,
});

sample({
  clock: fetchRoundFx.doneData,
  fn: (round) => round.status || RoundStatus.FINISHED,
  target: $roundStatus,
});

sample({
  clock: fetchRoundFx.doneData,
  fn: (round) => round.myScore || 0,
  target: $myScore,
});

// Обновляем счет после тапа
sample({
  clock: tapFx.doneData,
  fn: (response) => response.myTotalScore,
  target: $myScore,
});

// Обновляем раунд после тапа (для обновления totalScore)
sample({
  clock: tapFx.doneData,
  source: $currentRound,
  fn: (round, tapResponse) => {
    if (!round) return null;
    return {
      ...round,
      totalScore: round.totalScore + tapResponse.score,
    };
  },
  target: $currentRound,
});

