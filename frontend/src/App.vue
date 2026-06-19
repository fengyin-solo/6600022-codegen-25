<template>
  <div class="min-h-screen bg-gray-950 flex flex-col items-center p-4">
    <header class="w-full max-w-7xl mb-6">
      <h1 class="text-2xl font-bold text-green-400 text-center">棋类 AI 对弈与棋谱回放系统</h1>
      <p class="text-center text-gray-500 text-sm mt-1">五子棋 · Minimax + Alpha-Beta 剪枝</p>
    </header>

    <div class="flex flex-col xl:flex-row gap-6 max-w-7xl w-full items-start justify-center">
      <!-- Left Sidebar - Challenge Panel -->
      <div class="w-full xl:w-80 order-2 xl:order-1">
        <ChallengePanel v-if="activeTab === 'challenge'" />
        <div v-else class="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <h3 class="text-lg font-bold text-green-400 mb-3">模式选择</h3>
          <div class="space-y-3">
            <button
              @click="activeTab = 'challenge'"
              class="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm font-medium"
            >
              🎯 限时挑战赛
            </button>
            <button
              @click="activeTab = 'normal'"
              class="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            >
              🎮 自由对弈模式
            </button>
          </div>
        </div>
      </div>

      <!-- Board -->
      <div class="flex-shrink-0 order-1 xl:order-2">
        <div v-if="challengeStore.isChallengeActive && challengeStore.currentChallenge" class="mb-4">
          <div class="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-xl p-4 border border-green-500/30">
            <div class="flex items-center justify-between mb-2">
              <h2 class="text-lg font-bold text-white">{{ challengeStore.currentChallenge.name }}</h2>
              <span
                class="text-xs px-2 py-1 rounded-full"
                :class="{
                  'bg-green-600/30 text-green-400': challengeStore.currentChallenge.difficulty === 'easy',
                  'bg-yellow-600/30 text-yellow-400': challengeStore.currentChallenge.difficulty === 'medium',
                  'bg-red-600/30 text-red-400': challengeStore.currentChallenge.difficulty === 'hard',
                }"
              >
                {{ difficultyText[challengeStore.currentChallenge.difficulty] }}
              </span>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-gray-900/50 rounded-lg p-2 text-center">
                <div class="text-xl font-bold text-white">{{ challengeStore.remainingMoves }}</div>
                <div class="text-xs text-gray-400">剩余步数</div>
              </div>
              <div class="bg-gray-900/50 rounded-lg p-2 text-center">
                <div class="text-xl font-bold text-white">{{ challengeStore.formattedTime }}</div>
                <div class="text-xs text-gray-400">已用时间</div>
              </div>
              <div class="bg-gray-900/50 rounded-lg p-2 text-center">
                <div class="text-xl font-bold text-white">
                  <span class="inline-block w-3 h-3 rounded-full mr-1" :class="challengeStore.currentChallenge.playerColor === 1 ? 'bg-gray-800 border border-gray-600' : 'bg-white'"></span>
                  {{ challengeStore.currentChallenge.playerColor === 1 ? '黑' : '白' }}
                </div>
                <div class="text-xs text-gray-400">你执</div>
              </div>
            </div>
          </div>
        </div>
        <GameBoard />
      </div>

      <!-- Right Sidebar - Game Status & Settings -->
      <div class="w-full xl:w-80 space-y-4 order-3">
        <div v-if="activeTab === 'normal'" class="space-y-4">
          <!-- Game Status -->
          <div class="bg-gray-900 rounded-xl p-4 border border-gray-700">
            <h3 class="text-lg font-bold text-green-400 mb-3">游戏状态</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">状态</span>
                <span class="text-white">
                  {{ statusText }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">当前回合</span>
                <span class="flex items-center gap-1">
                  <span class="inline-block w-3 h-3 rounded-full" :class="store.currentPlayer === 1 ? 'bg-gray-800 border border-gray-600' : 'bg-white'"></span>
                  {{ store.currentPlayer === 1 ? '黑棋' : '白棋' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">手数</span>
                <span class="text-white">{{ store.currentMoveCount }}</span>
              </div>
              <div v-if="store.winner !== null" class="flex justify-between">
                <span class="text-gray-400">结果</span>
                <span class="font-bold" :class="store.winner === 1 ? 'text-gray-300' : store.winner === 2 ? 'text-white' : 'text-yellow-400'">
                  {{ store.winner === 1 ? '黑棋胜' : store.winner === 2 ? '白棋胜' : '平局' }}
                </span>
              </div>
            </div>

            <div class="mt-4 flex gap-2">
              <button
                @click="store.startGame()"
                class="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm font-medium"
              >
                {{ store.status === 'playing' ? '重新开始' : '开始游戏' }}
              </button>
            </div>
          </div>

          <!-- AI Settings -->
          <div class="bg-gray-900 rounded-xl p-4 border border-gray-700">
            <h3 class="text-lg font-bold text-green-400 mb-3">AI 设置</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-400">启用 AI</span>
                <button
                  @click="store.aiConfig.enabled = !store.aiConfig.enabled"
                  class="w-12 h-6 rounded-full transition-colors relative"
                  :class="store.aiConfig.enabled ? 'bg-green-600' : 'bg-gray-700'"
                >
                  <span
                    class="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform"
                    :class="store.aiConfig.enabled ? 'left-6' : 'left-0.5'"
                  />
                </button>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-400">AI 执</span>
                <div class="flex gap-2">
                  <button
                    @click="store.aiConfig.playerColor = 2"
                    class="px-3 py-1 text-xs rounded transition-colors"
                    :class="store.aiConfig.playerColor === 2 ? 'bg-white text-black' : 'bg-gray-800 text-gray-400'"
                  >白棋</button>
                  <button
                    @click="store.aiConfig.playerColor = 1"
                    class="px-3 py-1 text-xs rounded transition-colors"
                    :class="store.aiConfig.playerColor === 1 ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400'"
                  >黑棋</button>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm text-gray-400">搜索深度</span>
                  <span class="text-sm text-white">{{ store.aiConfig.depth }}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  v-model.number="store.aiConfig.depth"
                  class="w-full accent-green-500"
                />
                <div class="flex justify-between text-xs text-gray-600">
                  <span>1 (快)</span>
                  <span>4 (强)</span>
                </div>
              </div>
              <div v-if="store.isAiThinking" class="flex items-center gap-2 text-yellow-400 text-sm">
                <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                AI 思考中...
              </div>
            </div>
          </div>

          <!-- Replay Panel -->
          <ReplayPanel />
        </div>

        <div v-else class="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <h3 class="text-lg font-bold text-green-400 mb-3">模式选择</h3>
          <div class="space-y-3">
            <button
              @click="activeTab = 'challenge'"
              class="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm font-medium"
            >
              🎯 限时挑战赛
            </button>
            <button
              @click="activeTab = 'normal'"
              class="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            >
              🎮 自由对弈模式
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useGameStore } from './store/game';
import { useChallengeStore } from './store/challenge';
import GameBoard from './components/GameBoard.vue';
import ReplayPanel from './components/ReplayPanel.vue';
import ChallengePanel from './components/ChallengePanel.vue';

const store = useGameStore();
const challengeStore = useChallengeStore();

const activeTab = ref<'normal' | 'challenge'>('challenge');

const difficultyText: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

const statusText = computed(() => {
  if (challengeStore.isChallengeActive) return '挑战赛进行中';
  if (challengeStore.replayMoves.length > 0) return '挑战回放中';
  switch (store.status) {
    case 'idle': return '等待开始';
    case 'playing': return '对弈中';
    case 'finished': return '已结束';
    case 'replaying': return '回放中';
    default: return '';
  }
});

watch(activeTab, (newTab) => {
  if (newTab === 'normal' && challengeStore.isChallengeActive) {
    if (confirm('切换模式将退出当前挑战，确定要继续吗？')) {
      challengeStore.exitChallenge();
    } else {
      activeTab.value = 'challenge';
    }
  }
});
</script>
