export enum UserRole {
  SURVIVOR = 'SURVIVOR',
  NIKITA = 'NIKITA',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export enum RoundStatus {
  COOLDOWN = 'COOLDOWN',
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
}

export interface Round {
  id: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  totalScore: number;
  status?: RoundStatus;
  winner?: {
    id: string;
    username: string;
  };
  winnerId?: string;
  myScore?: number;
  winnerScore?: number;
}

export interface TapResponse {
  tapId: string;
  score: number;
  myTotalScore: number;
  tapNumber: number;
}

