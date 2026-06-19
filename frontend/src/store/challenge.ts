import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  ChallengeConfig,
  ChallengeAttempt,
  ChallengeRanking,
  ChallengeState,
  Move,
  BoardState,
} from '../types';
import { useGameStore } from './game';

const BOARD_SIZE = 15;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]];

function countDirection(board: BoardState, row: number, col: number, dr: number, dc: number, player: number): number {
  let count = 0;
  let r = row + dr;
  let c = col + dc;
  while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
    count++;
    r += dr;
    c += dc;
  }
  return count;
}

function evaluateBoardForChallenge(board: BoardState, player: number): number {
  let score = 0;
  const SCORE_TABLE: Record<string, number> = {
    'five': 1000000,
    'live-four': 100000,
    'dead-four': 10000,
    'live-three': 10000,
    'dead-three': 1000,
    'live-two': 1000,
    'dead-two': 100,
    'live-one': 100,
    'dead-one': 10,
  };

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === player) {
        for (const [dr, dc] of DIRECTIONS) {
          const count = 1 + countDirection(board, r, c, dr, dc, player) + countDirection(board, r, c, -dr, -dc, player);
          if (count >= 5) {
            score += SCORE_TABLE['five'];
            continue;
          }
          const fwdBlocked = countDirection(board, r, c, dr, dc, player) < 0 || (r + dr * (countDirection(board, r, c, dr, dc, player) + 1) < 0 || r + dr * (countDirection(board, r, c, dr, dc, player) + 1) >= BOARD_SIZE || c + dc * (countDirection(board, r, c, dr, dc, player) + 1) < 0 || c + dc * (countDirection(board, r, c, dr, dc, player) + 1) >= BOARD_SIZE || board[r + dr * (countDirection(board, r, c, dr, dc, player) + 1)]?.[c + dc * (countDirection(board, r, c, dr, dc, player) + 1)] !== EMPTY);
          const bwdBlocked = countDirection(board, r, c, -dr, -dc, player) < 0 || (r - dr * (countDirection(board, r, c, -dr, -dc, player) + 1) < 0 || r - dr * (countDirection(board, r, c, -dr, -dc, player) + 1) >= BOARD_SIZE || c - dc * (countDirection(board, r, c, -dr, -dc, player) + 1) < 0 || c - dc * (countDirection(board, r, c, -dr, -dc, player) + 1) >= BOARD_SIZE || board[r - dr * (countDirection(board, r, c, -dr, -dc, player) + 1)]?.[c - dc * (countDirection(board, r, c, -dr, -dc, player) + 1)] !== EMPTY);
          const openEnds = (fwdBlocked ? 0 : 1) + (bwdBlocked ? 0 : 1);
          if (openEnds === 0) continue;
          const key = count === 4 ? (openEnds === 2 ? 'live-four' : 'dead-four')
            : count === 3 ? (openEnds === 2 ? 'live-three' : 'dead-three')
            : count === 2 ? (openEnds === 2 ? 'live-two' : 'dead-two')
            : (openEnds === 2 ? 'live-one' : 'dead-one');
          score += SCORE_TABLE[key] || 0;
        }
      }
    }
  }
  return score;
}

const DEFAULT_CHALLENGES: ChallengeConfig[] = [
  {
    id: 'challenge-1',
    name: '速胜挑战',
    description: '在20步内战胜AI',
    targetType: 'win_in_moves',
    targetValue: 20,
    maxMoves: 20,
    aiDepth: 2,
    playerColor: BLACK,
    timeLimit: 300,
    difficulty: 'easy',
  },
  {
    id: 'challenge-2',
    name: '坚守阵地',
    description: '在30步内不让AI获胜',
    targetType: 'defend_moves',
    targetValue: 30,
    maxMoves: 30,
    aiDepth: 3,
    playerColor: WHITE,
    timeLimit: 300,
    difficulty: 'medium',
  },
  {
    id: 'challenge-3',
    name: '高分挑战',
    description: '在25步内获得最高棋形分数',
    targetType: 'score_target',
    targetValue: 50000,
    maxMoves: 25,
    aiDepth: 3,
    playerColor: BLACK,
    timeLimit: 300,
    difficulty: 'hard',
  },
  {
    id: 'challenge-4',
    name: '闪电战',
    description: '在15步内战胜AI',
    targetType: 'win_in_moves',
    targetValue: 15,
    maxMoves: 15,
    aiDepth: 2,
    playerColor: BLACK,
    timeLimit: 120,
    difficulty: 'medium',
  },
  {
    id: 'challenge-5',
    name: '大师之路',
    description: '在35步内战胜深度4的AI',
    targetType: 'win_in_moves',
    targetValue: 35,
    maxMoves: 35,
    aiDepth: 4,
    playerColor: BLACK,
    timeLimit: 600,
    difficulty: 'hard',
  },
];

function createEmptyBoard(): BoardState {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY));
}

function loadAttemptsFromStorage(): ChallengeAttempt[] {
  try {
    const stored = localStorage.getItem('challenge_attempts');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveAttemptsToStorage(attempts: ChallengeAttempt[]): void {
  localStorage.setItem('challenge_attempts', JSON.stringify(attempts));
}

export const useChallengeStore = defineStore('challenge', () => {
  const gameStore = useGameStore();

  const currentChallenge = ref<ChallengeConfig | null>(null);
  const isChallengeActive = ref(false);
  const remainingMoves = ref(0);
  const elapsedTime = ref(0);
  const attempts = ref<ChallengeAttempt[]>(loadAttemptsFromStorage());
  const rankings = ref<ChallengeRanking[]>([]);
  const playerName = ref(localStorage.getItem('challenge_player_name') || '玩家');

  const challengeStartTime = ref<number>(0);
  let timerInterval: ReturnType<typeof setInterval> | null = null;

  const replayMoves = ref<Move[]>([]);
  const replayIndex = ref(0);
  const replayBoard = ref<BoardState>(createEmptyBoard());
  const isReplayPlaying = ref(false);
  const replaySpeed = ref(1000);
  let replayTimer: ReturnType<typeof setInterval> | null = null;

  const isTimeUp = computed(() => currentChallenge.value && elapsedTime.value >= currentChallenge.value.timeLimit);
  const isMovesUp = computed(() => remainingMoves.value <= 0);
  const canPlay = computed(() => isChallengeActive.value && !isTimeUp.value && !isMovesUp.value);
  const formattedTime = computed(() => {
    const mins = Math.floor(elapsedTime.value / 60);
    const secs = elapsedTime.value % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  });

  const availableChallenges = computed(() => DEFAULT_CHALLENGES);

  function setPlayerName(name: string): void {
    playerName.value = name;
    localStorage.setItem('challenge_player_name', name);
  }

  function startChallenge(challenge: ChallengeConfig): void {
    stopTimer();
    currentChallenge.value = challenge;
    isChallengeActive.value = true;
    remainingMoves.value = challenge.maxMoves;
    elapsedTime.value = 0;
    challengeStartTime.value = Date.now();

    gameStore.aiConfig.depth = challenge.aiDepth;
    gameStore.aiConfig.enabled = true;
    gameStore.aiConfig.playerColor = challenge.playerColor === BLACK ? WHITE : BLACK;
    gameStore.startGame();

    startTimer();
  }

  function startTimer(): void {
    stopTimer();
    timerInterval = setInterval(() => {
      if (isChallengeActive.value) {
        elapsedTime.value++;
        if (isTimeUp.value) {
          endChallenge(false);
        }
      }
    }, 1000);
  }

  function stopTimer(): void {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function recordMove(): void {
    if (!isChallengeActive.value) return;
    remainingMoves.value--;

    if (isMovesUp.value) {
      checkChallengeCompletion();
    }
  }

  function checkChallengeCompletion(): void {
    if (!currentChallenge.value || !isChallengeActive.value) return;

    const challenge = currentChallenge.value;
    const moves = gameStore.moves;
    const lastMove = moves[moves.length - 1];
    const playerWon = gameStore.winner === challenge.playerColor;
    const aiWon = gameStore.winner !== null && gameStore.winner !== challenge.playerColor && gameStore.winner !== 0;

    let success = false;

    switch (challenge.targetType) {
      case 'win_in_moves':
        success = playerWon && moves.length <= challenge.targetValue;
        if (aiWon || isMovesUp.value) {
          endChallenge(false);
          return;
        }
        if (success) {
          endChallenge(true);
        }
        break;
      case 'defend_moves':
        if (aiWon) {
          endChallenge(false);
          return;
        }
        success = !aiWon && (moves.length >= challenge.targetValue || gameStore.winner === 0 || isMovesUp.value);
        if (success || isMovesUp.value) {
          endChallenge(success);
        }
        break;
      case 'score_target':
        if (aiWon) {
          endChallenge(false);
          return;
        }
        if (isMovesUp.value || gameStore.winner !== null) {
          const score = evaluateBoardForChallenge(gameStore.board, challenge.playerColor);
          success = score >= challenge.targetValue;
          endChallenge(success);
        }
        break;
    }

    if (gameStore.isGameOver && gameStore.winner !== null) {
      if (challenge.targetType === 'win_in_moves') {
        success = playerWon && moves.length <= challenge.targetValue;
      } else if (challenge.targetType === 'defend_moves') {
        success = !aiWon && (gameStore.winner === 0 || playerWon);
      } else {
        const score = evaluateBoardForChallenge(gameStore.board, challenge.playerColor);
        success = score >= challenge.targetValue;
      }
      endChallenge(success);
    }
  }

  function calculateScore(success: boolean): number {
    if (!currentChallenge.value) return 0;

    const challenge = currentChallenge.value;
    const moves = gameStore.moves;
    const duration = moves.length > 0 ? moves[moves.length - 1].timestamp - challengeStartTime.value : 0;

    let baseScore = success ? 1000 : 100;

    const movesBonus = Math.max(0, (challenge.maxMoves - moves.length) * 50);
    const timeBonus = Math.max(0, (challenge.timeLimit - elapsedTime.value) * 2);

    const difficultyMultiplier = { easy: 1, medium: 1.5, hard: 2 }[challenge.difficulty];

    if (success && challenge.targetType === 'score_target') {
      const boardScore = evaluateBoardForChallenge(gameStore.board, challenge.playerColor);
      baseScore += Math.floor(boardScore / 100);
    }

    return Math.floor((baseScore + movesBonus + timeBonus) * difficultyMultiplier);
  }

  function endChallenge(success: boolean): void {
    if (!currentChallenge.value || !isChallengeActive.value) return;

    stopTimer();
    isChallengeActive.value = false;

    const moves = gameStore.moves;
    const score = calculateScore(success);

    const attempt: ChallengeAttempt = {
      id: Date.now().toString(),
      challengeId: currentChallenge.value.id,
      playerName: playerName.value,
      moves: [...moves],
      success,
      finalMoveCount: moves.length,
      duration: elapsedTime.value,
      score,
      completedAt: new Date().toLocaleString('zh-CN'),
      winner: gameStore.winner,
    };

    attempts.value.unshift(attempt);
    saveAttemptsToStorage(attempts.value);
    updateRankings(currentChallenge.value.id);
  }

  function exitChallenge(): void {
    stopTimer();
    isChallengeActive.value = false;
    currentChallenge.value = null;
    remainingMoves.value = 0;
    elapsedTime.value = 0;
    gameStore.startGame();
  }

  function updateRankings(challengeId: string): void {
    const challengeAttempts = attempts.value.filter(a => a.challengeId === challengeId);

    const sorted = [...challengeAttempts].sort((a, b) => {
      if (b.success !== a.success) return b.success ? 1 : -1;
      if (b.score !== a.score) return b.score - a.score;
      if (a.finalMoveCount !== b.finalMoveCount) return a.finalMoveCount - b.finalMoveCount;
      return a.duration - b.duration;
    });

    rankings.value = sorted.map((attempt, index) => ({
      rank: index + 1,
      playerName: attempt.playerName,
      score: attempt.score,
      moveCount: attempt.finalMoveCount,
      duration: attempt.duration,
      success: attempt.success,
      completedAt: attempt.completedAt,
      attemptId: attempt.id,
    }));
  }

  function getRankingsForChallenge(challengeId: string): ChallengeRanking[] {
    updateRankings(challengeId);
    return rankings.value;
  }

  function getAttemptsForChallenge(challengeId: string): ChallengeAttempt[] {
    return attempts.value.filter(a => a.challengeId === challengeId);
  }

  function getBestAttempt(challengeId: string): ChallengeAttempt | null {
    const challengeAttempts = getAttemptsForChallenge(challengeId)
      .filter(a => a.success)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.finalMoveCount !== b.finalMoveCount) return a.finalMoveCount - b.finalMoveCount;
        return a.duration - b.duration;
      });
    return challengeAttempts[0] || null;
  }

  function startChallengeReplay(attempt: ChallengeAttempt): void {
    replayMoves.value = [...attempt.moves];
    replayIndex.value = 0;
    replayBoard.value = createEmptyBoard();
    isReplayPlaying.value = false;
  }

  function replayStepForward(): void {
    if (replayIndex.value >= replayMoves.value.length) return;
    const move = replayMoves.value[replayIndex.value];
    replayBoard.value[move.row][move.col] = move.player;
    replayIndex.value++;
  }

  function replayStepBack(): void {
    if (replayIndex.value <= 0) return;
    replayIndex.value--;
    const move = replayMoves.value[replayIndex.value];
    replayBoard.value[move.row][move.col] = EMPTY;
  }

  function replayGoToStart(): void {
    replayBoard.value = createEmptyBoard();
    replayIndex.value = 0;
  }

  function replayGoToEnd(): void {
    replayBoard.value = createEmptyBoard();
    for (let i = 0; i < replayMoves.value.length; i++) {
      const m = replayMoves.value[i];
      replayBoard.value[m.row][m.col] = m.player;
    }
    replayIndex.value = replayMoves.value.length;
  }

  function toggleReplayPlay(): void {
    isReplayPlaying.value = !isReplayPlaying.value;
    if (isReplayPlaying.value) {
      replayTimer = setInterval(() => {
        if (replayIndex.value >= replayMoves.value.length) {
          isReplayPlaying.value = false;
          if (replayTimer) clearInterval(replayTimer);
          replayTimer = null;
          return;
        }
        replayStepForward();
      }, replaySpeed.value);
    } else {
      if (replayTimer) clearInterval(replayTimer);
      replayTimer = null;
    }
  }

  function setReplaySpeed(ms: number): void {
    replaySpeed.value = ms;
    if (isReplayPlaying.value) {
      if (replayTimer) clearInterval(replayTimer);
      replayTimer = setInterval(() => {
        if (replayIndex.value >= replayMoves.value.length) {
          isReplayPlaying.value = false;
          if (replayTimer) clearInterval(replayTimer);
          replayTimer = null;
          return;
        }
        replayStepForward();
      }, replaySpeed.value);
    }
  }

  function stopReplay(): void {
    isReplayPlaying.value = false;
    if (replayTimer) clearInterval(replayTimer);
    replayTimer = null;
    replayMoves.value = [];
    replayIndex.value = 0;
    replayBoard.value = createEmptyBoard();
  }

  function clearAllData(): void {
    attempts.value = [];
    rankings.value = [];
    localStorage.removeItem('challenge_attempts');
  }

  return {
    currentChallenge,
    isChallengeActive,
    remainingMoves,
    elapsedTime,
    attempts,
    rankings,
    playerName,
    isTimeUp,
    isMovesUp,
    canPlay,
    formattedTime,
    availableChallenges,
    replayMoves,
    replayIndex,
    replayBoard,
    isReplayPlaying,
    replaySpeed,
    setPlayerName,
    startChallenge,
    recordMove,
    checkChallengeCompletion,
    endChallenge,
    exitChallenge,
    updateRankings,
    getRankingsForChallenge,
    getAttemptsForChallenge,
    getBestAttempt,
    startChallengeReplay,
    replayStepForward,
    replayStepBack,
    replayGoToStart,
    replayGoToEnd,
    toggleReplayPlay,
    setReplaySpeed,
    stopReplay,
    clearAllData,
  };
});
