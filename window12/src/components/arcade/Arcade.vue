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
  border: 1px solid var(--glass-edge);
  border-radius: var(--r-pill);
  background: var(--glass-thin);
  color: var(--text-muted);
  font-family: var(--body-font);
  font-size: var(--fs-caption);
  cursor: pointer;
  transition:
    background-color var(--dur-2) var(--spring-settle),
    color var(--dur-2) var(--spring-settle),
    border-color var(--dur-2) var(--spring-settle),
    transform var(--dur-2) var(--spring-jelly);
}

.arcade-tab:hover {
  color: var(--text);
}

.arcade-tab:active {
  transform: scale(0.94);
  transition-duration: var(--dur-1);
}

.arcade-tab.on {
  border-color: color-mix(in srgb, var(--accent) 40%, var(--glass-edge));
  background: color-mix(in srgb, var(--accent) 18%, var(--glass-base));
  color: var(--text);
}

.arcade-empty {
  margin: 18px 4px;
  font-size: var(--fs-label);
  color: var(--text-muted);
  text-align: center;
}
</style>
