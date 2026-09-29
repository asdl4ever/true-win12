<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, type Component } from 'vue'
import { games } from '../../data/games'
import { useDesktopStore } from '../../stores/desktop'
import Game2048 from './games/Game2048.vue'
import SnakeGame from './games/SnakeGame.vue'
import WhackAMoleGame from './games/WhackAMoleGame.vue'

const desktop = useDesktopStore()
const { activeGame, installedGames } = storeToRefs(desktop)

const GAME_COMPONENTS: Record<string, Component> = {
  snake: SnakeGame,
  whack: WhackAMoleGame,
  '2048': Game2048,
}

const installed = computed(() => games.filter((game) => installedGames.value.includes(game.id)))
const current = computed(
  () => games.find((game) => game.id === activeGame.value) ?? installed.value[0] ?? null,
)
</script>

<template>
  <div class="arcade">
    <div v-if="installed.length > 1" class="arcade-tabs">
      <button
        v-for="game in installed"
        :key="game.id"
        class="arcade-tab"
        :class="{ on: current?.id === game.id }"
        type="button"
        @click="activeGame = game.id"
      >
        <v-icon :icon="game.icon" size="15" />
        {{ game.name }}
      </button>
    </div>

    <component :is="GAME_COMPONENTS[current.id]" v-if="current" :key="current.id" />
    <p v-else class="arcade-empty">还没有安装游戏，去应用商店挑一个吧。</p>
  </div>
</template>

<style scoped>
.arcade {
  display: flex;
  flex-direction: column;
  padding: 10px 12px 12px;
}

.arcade-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-bottom: 8px;
}

.arcade-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: 1px solid rgba(61, 43, 14, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.45);
  color: var(--text-muted);
  font-family: var(--body-font);
  font-size: 12px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}

.arcade-tab:hover {
  color: var(--text);
}

.arcade-tab.on {
  border-color: color-mix(in srgb, var(--accent) 55%, transparent);
  background: color-mix(in srgb, var(--accent) 18%, rgba(255, 255, 255, 0.6));
  color: var(--text);
}

.arcade-empty {
  margin: 18px 4px;
  font-size: 12.5px;
  color: var(--text-muted);
  text-align: center;
}
</style>
