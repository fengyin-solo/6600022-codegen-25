<template>
  <div class="bg-gray-900 rounded-xl p-4 border border-gray-700">
    <h3 class="text-lg font-bold text-green-400 mb-3">限时挑战赛</h3>

    <div v-if="!challengeStore.isChallengeActive && !challengeStore.replayMoves.length">
      <div class="mb-4">
        <label class="text-sm text-gray-400 block mb-1">玩家名称</label>
        <input
          v-model="playerNameInput"
          @blur="updatePlayerName"
          @keyup.enter="updatePlayerName"
          type="text"
          class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
          placeholder="输入你的名称"
        />
      </div>

      <p class="text-sm text-gray-500 mb-3">选择一个挑战开始比赛</p>
      <div class="space-y-2 max-h-80 overflow-y-auto">
        <div
          v-for="challenge in challengeStore.availableChallenges"
          :key="challenge.id"
          class="bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-700 transition-colors border border-gray-700"
          @click="selectChallenge(challenge)"
        >
          <div class="flex justify-between items-start mb-1">
            <span class="text-white font-medium text-sm">{{ challenge.name }}</span>
            <span
              class="text-xs px-2 py-0.5 rounded-full"
              :class="{
                'bg-green-600/30 text-green-400': challenge.difficulty === 'easy',
                'bg-yellow-600/30 text-yellow-400': challenge.difficulty === 'medium',
                'bg-red-600/30 text-red-400': challenge.difficulty === 'hard',
              }"
            >
              {{ difficultyText[challenge.difficulty] }}
            </span>
          </div>
          <p class="text-xs text-gray-400 mb-2">{{ challenge.description }}</p>
          <div class="flex gap-3 text-xs text-gray-500">
            <span>步数: {{ challenge.maxMoves }}</span>
            <span>时间: {{ formatTimeLimit(challenge.timeLimit) }}</span>
            <span>AI深度: {{ challenge.aiDepth }}</span>
          </div>
          <div v-if="getBestScore(challenge.id)" class="mt-2 text-xs">
            <span class="text-gray-500">最佳成绩: </span>
            <span class="text-yellow-400 font-medium">{{ getBestScore(challenge.id) }} 分</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="selectedChallenge && !challengeStore.isChallengeActive && !challengeStore.replayMoves.length">
      <div class="bg-gray-800 rounded-lg p-4 mb-4">
        <h4 class="text-white font-medium mb-2">{{ selectedChallenge.name }}</h4>
        <p class="text-sm text-gray-400 mb-3">{{ selectedChallenge.description }}</p>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="bg-gray-900 rounded p-2">
            <span class="text-gray-500">目标类型</span>
            <p class="text-white">{{ targetTypeText[selectedChallenge.targetType] }}</p>
          </div>
          <div class="bg-gray-900 rounded p-2">
            <span class="text-gray-500">目标值</span>
            <p class="text-white">{{ selectedChallenge.targetValue }}</p>
          </div>
          <div class="bg-gray-900 rounded p-2">
            <span class="text-gray-500">最大步数</span>
            <p class="text-white">{{ selectedChallenge.maxMoves }}</p>
          </div>
          <div class="bg-gray-900 rounded p-2">
            <span class="text-gray-500">时间限制</span>
            <p class="text-white">{{ formatTimeLimit(selectedChallenge.timeLimit) }}</p>
          </div>
          <div class="bg-gray-900 rounded p-2">
            <span class="text-gray-500">执棋</span>
            <p class="text-white">{{ selectedChallenge.playerColor === 1 ? '黑棋' : '白棋' }}</p>
          </div>
          <div class="bg-gray-900 rounded p-2">
            <span class="text-gray-500">AI难度</span>
            <p class="text-white">深度 {{ selectedChallenge.aiDepth }}</p>
          </div>
        </div>
      </div>

      <div class="flex gap-2 mb-4">
        <button
          @click="startSelectedChallenge"
          class="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm font-medium"
        >
          开始挑战
        </button>
        <button
          @click="selectedChallenge = null"
          class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
        >
          返回
        </button>
      </div>

      <div class="bg-gray-800 rounded-lg p-3">
        <h5 class="text-sm font-medium text-gray-300 mb-2">排行榜</h5>
        <div v-if="getRankings(selectedChallenge.id).length === 0" class="text-xs text-gray-500 text-center py-4">
          暂无记录，成为第一个挑战者！
        </div>
        <div v-else class="space-y-1 max-h-40 overflow-y-auto">
          <div
            v-for="ranking in getRankings(selectedChallenge.id).slice(0, 10)"
            :key="ranking.attemptId"
            class="flex items-center justify-between text-xs py-1 border-b border-gray-700 last:border-0"
          >
            <div class="flex items-center gap-2">
              <span
                class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                :class="{
                  'bg-yellow-500 text-black': ranking.rank === 1,
                  'bg-gray-400 text-black': ranking.rank === 2,
                  'bg-amber-600 text-white': ranking.rank === 3,
                  'bg-gray-700 text-gray-400': ranking.rank > 3,
                }"
              >
                {{ ranking.rank }}
              </span>
              <span :class="ranking.success ? 'text-white' : 'text-gray-500'">{{ ranking.playerName }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-green-400 font-medium">{{ ranking.score }}</span>
              <button
                @click.stop="replayAttempt(ranking.attemptId)"
                class="text-gray-500 hover:text-green-400 transition-colors"
                title="回放"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="challengeStore.isChallengeActive && challengeStore.currentChallenge">
      <div class="bg-gray-800 rounded-lg p-4 mb-4">
        <h4 class="text-white font-medium mb-3">{{ challengeStore.currentChallenge.name }}</h4>
        <p class="text-xs text-gray-400 mb-3">{{ challengeStore.currentChallenge.description }}</p>

        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="bg-gray-900 rounded-lg p-3 text-center">
            <div class="text-2xl font-bold" :class="challengeStore.remainingMoves <= 3 ? 'text-red-400' : 'text-white'">
              {{ challengeStore.remainingMoves }}
            </div>
            <div class="text-xs text-gray-500">剩余步数</div>
          </div>
          <div class="bg-gray-900 rounded-lg p-3 text-center">
            <div class="text-2xl font-bold" :class="isTimeLow ? 'text-red-400' : 'text-white'">
              {{ challengeStore.formattedTime }}
            </div>
            <div class="text-xs text-gray-500">已用时间</div>
          </div>
        </div>

        <div class="w-full bg-gray-700 rounded-full h-2 mb-2">
          <div
            class="h-2 rounded-full transition-all"
            :class="challengeStore.remainingMoves <= 3 ? 'bg-red-500' : 'bg-green-500'"
            :style="{ width: `${(challengeStore.remainingMoves / challengeStore.currentChallenge.maxMoves) * 100}%` }"
          />
        </div>
        <div class="flex justify-between text-xs text-gray-500">
          <span>0</span>
          <span>{{ challengeStore.currentChallenge.maxMoves }} 步</span>
        </div>

        <div class="mt-4 p-3 bg-gray-900 rounded-lg">
          <div class="text-xs text-gray-400 mb-1">挑战目标</div>
          <div class="text-sm text-white">
            {{ getTargetDescription(challengeStore.currentChallenge) }}
          </div>
        </div>
      </div>

      <button
        @click="confirmExit"
        class="w-full py-2 bg-red-600/20 border border-red-600/50 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
      >
        退出挑战
      </button>
    </div>

    <div v-else-if="latestAttempt && !challengeStore.isChallengeActive && !challengeStore.replayMoves.length">
      <div class="bg-gray-800 rounded-lg p-4 mb-4 text-center">
        <div class="text-5xl mb-3">{{ latestAttempt.success ? '🎉' : '😔' }}</div>
        <h4 class="text-xl font-bold mb-1" :class="latestAttempt.success ? 'text-green-400' : 'text-red-400'">
          {{ latestAttempt.success ? '挑战成功！' : '挑战失败' }}
        </h4>
        <p class="text-sm text-gray-400 mb-4">{{ latestAttempt.success ? '恭喜你完成了挑战！' : '再接再厉，下次一定可以！' }}</p>

        <div class="grid grid-cols-3 gap-2 mb-4">
          <div class="bg-gray-900 rounded p-2">
            <div class="text-lg font-bold text-yellow-400">{{ latestAttempt.score }}</div>
            <div class="text-xs text-gray-500">得分</div>
          </div>
          <div class="bg-gray-900 rounded p-2">
            <div class="text-lg font-bold text-white">{{ latestAttempt.finalMoveCount }}</div>
            <div class="text-xs text-gray-500">步数</div>
          </div>
          <div class="bg-gray-900 rounded p-2">
            <div class="text-lg font-bold text-white">{{ formatDuration(latestAttempt.duration) }}</div>
            <div class="text-xs text-gray-500">用时</div>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            @click="replayLatestAttempt"
            class="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm"
          >
            查看回放
          </button>
          <button
            @click="tryAgain"
            class="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm"
          >
            再试一次
          </button>
        </div>
      </div>

      <button
        @click="backToChallengeList"
        class="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
      >
        返回挑战列表
      </button>
    </div>

    <div v-if="challengeStore.replayMoves.length > 0">
      <ChallengeReplayViewer @close="closeReplay" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useChallengeStore } from '../store/challenge';
import type { ChallengeConfig, ChallengeAttempt } from '../types';
import ChallengeReplayViewer from './ChallengeReplayViewer.vue';

const challengeStore = useChallengeStore();

const playerNameInput = ref(challengeStore.playerName);
const selectedChallenge = ref<ChallengeConfig | null>(null);

const difficultyText: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

const targetTypeText: Record<string, string> = {
  win_in_moves: '限定步数内获胜',
  defend_moves: '坚守指定步数',
  score_target: '达到目标分数',
};

const isTimeLow = computed(() => {
  if (!challengeStore.currentChallenge) return false;
  return challengeStore.elapsedTime >= challengeStore.currentChallenge.timeLimit * 0.8;
});

const latestAttempt = computed(() => {
  if (!challengeStore.currentChallenge) return null;
  const attempts = challengeStore.getAttemptsForChallenge(challengeStore.currentChallenge.id);
  return attempts[0] || null;
});

function updatePlayerName() {
  if (playerNameInput.value.trim()) {
    challengeStore.setPlayerName(playerNameInput.value.trim());
  } else {
    playerNameInput.value = challengeStore.playerName;
  }
}

function formatTimeLimit(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}分${secs}秒` : `${mins}分钟`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getTargetDescription(challenge: ChallengeConfig): string {
  switch (challenge.targetType) {
    case 'win_in_moves':
      return `在 ${challenge.targetValue} 步内战胜AI`;
    case 'defend_moves':
      return `坚守 ${challenge.targetValue} 步不让AI获胜`;
    case 'score_target':
      return `达到 ${challenge.targetValue} 分的棋形分数`;
    default:
      return '';
  }
}

function getBestScore(challengeId: string): number | null {
  const best = challengeStore.getBestAttempt(challengeId);
  return best ? best.score : null;
}

function getRankings(challengeId: string) {
  return challengeStore.getRankingsForChallenge(challengeId);
}

function selectChallenge(challenge: ChallengeConfig) {
  selectedChallenge.value = challenge;
}

function startSelectedChallenge() {
  if (selectedChallenge.value) {
    challengeStore.startChallenge(selectedChallenge.value);
    selectedChallenge.value = null;
  }
}

function confirmExit() {
  if (confirm('确定要退出当前挑战吗？当前进度将不会保存。')) {
    challengeStore.exitChallenge();
  }
}

function replayAttempt(attemptId: string) {
  const attempt = challengeStore.attempts.find(a => a.id === attemptId);
  if (attempt) {
    challengeStore.startChallengeReplay(attempt);
  }
}

function replayLatestAttempt() {
  if (latestAttempt.value) {
    challengeStore.startChallengeReplay(latestAttempt.value);
  }
}

function tryAgain() {
  if (challengeStore.currentChallenge) {
    challengeStore.startChallenge(challengeStore.currentChallenge);
  }
}

function backToChallengeList() {
  challengeStore.exitChallenge();
}

function closeReplay() {
  challengeStore.stopReplay();
}
</script>
