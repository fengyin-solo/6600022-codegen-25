export type BoardState = number[][];

export interface Move {
  row: number;
  col: number;
  player: number; // 1=black, 2=white
  timestamp: number;
}

export interface GameRecord {
  id: string;
  moves: Move[];
  winner: number | null; // 0=draw, 1=black, 2=white, null=ongoing
  createdAt: string;
  duration: number;
}

export interface AIConfig {
  depth: number;
  enabled: boolean;
  playerColor: number; // AI plays as this color
}

export type GameStatus = 'idle' | 'playing' | 'finished' | 'replaying';

export type ChallengeTargetType = 'win_in_moves' | 'defend_moves' | 'score_target';

export interface ChallengeConfig {
  id: string;
  name: string;
  description: string;
  targetType: ChallengeTargetType;
  targetValue: number;
  maxMoves: number;
  aiDepth: number;
  playerColor: number;
  timeLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
  startTimestamp?: number;
  endTimestamp?: number;
}

export interface ChallengeAttempt {
  id: string;
  challengeId: string;
  playerName: string;
  moves: Move[];
  success: boolean;
  finalMoveCount: number;
  duration: number;
  score: number;
  completedAt: string;
  winner: number | null;
}

export interface ChallengeRanking {
  rank: number;
  playerName: string;
  score: number;
  moveCount: number;
  duration: number;
  success: boolean;
  completedAt: string;
  attemptId: string;
}

export interface ChallengeState {
  currentChallenge: ChallengeConfig | null;
  isChallengeActive: boolean;
  remainingMoves: number;
  elapsedTime: number;
  attempts: ChallengeAttempt[];
  rankings: ChallengeRanking[];
}
