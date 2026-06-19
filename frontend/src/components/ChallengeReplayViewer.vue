<template>
  <div class="bg-gray-800 rounded-lg p-4">
    <h4 class="text-white font-medium mb-3 flex justify-between items-center">
      <span>挑战回放</span>
      <button @click="$emit('close')" class="text-gray-400 hover:text-white transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </h4>

    <div class="text-center mb-3">
      <span class="text-gray-400 text-sm">第 {{ store.replayIndex }} / {{ store.replayMoves.length }} 手</span>
    </div>

    <div class="w-full bg-gray-700 rounded-full h-2 mb-4">
      <div
        class="bg-green-500 h-2 rounded-full transition-all"
        :style="{ width: `${(store.replayIndex / store.replayMoves.length) * 100}%` }"
      />
    </div>

    <div class="flex items-center justify-center gap-2 mb-4">
      <button @click="store.replayGoToStart()" class="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-gray-300 transition-colors" title="回到开始">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
        </svg>
      </button>
      <button @click="store.replayStepBack()" class="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-gray-300 transition-colors" title="上一步">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <button @click="store.toggleReplayPlay()" class="p-3 bg-green-600 rounded-lg hover:bg-green-500 text-white transition-colors" :title="store.isReplayPlaying ? '暂停' : '播放'">
        <svg v-if="!store.isReplayPlaying" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
        <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
        </svg>
      </button>
      <button @click="store.replayStepForward()" class="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-gray-300 transition-colors" title="下一步">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
      <button @click="store.replayGoToEnd()" class="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-gray-300 transition-colors" title="跳到结尾">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
        </svg>
      </button>
    </div>

    <div class="flex items-center justify-center gap-2">
      <span class="text-xs text-gray-500">速度:</span>
      <button
        v-for="speed in speeds"
        :key="speed.value"
        @click="store.setReplaySpeed(speed.value)"
        class="px-2 py-1 text-xs rounded transition-colors"
        :class="store.replaySpeed === speed.value ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'"
      >
        {{ speed.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChallengeStore } from '../store/challenge';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const store = useChallengeStore();

const speeds = [
  { label: '慢', value: 2000 },
  { label: '中', value: 1000 },
  { label: '快', value: 500 },
  { label: '极快', value: 200 },
];
</script>
