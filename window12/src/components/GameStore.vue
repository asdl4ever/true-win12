<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { games, useDesktopStore } from '../stores/desktop'

const desktop = useDesktopStore()
const { installedGames, installing } = storeToRefs(desktop)

const query = ref('')
const category = ref('全部')
const categories = ['全部', ...new Set(games.map((game) => game.category))]

const visibleGames = computed(() =>
  games.filter(
    (game) =>
      (category.value === '全部' || game.category === category.value) &&
      game.name.includes(query.value.trim()),
  ),
)

function progressOf(id: string) {
  return installing.value[id]
}
</script>

<template>
  <div class="store">
    <div class="store-tools">
      <v-text-field
        v-model="query"
        class="glass-field"
        density="compact"
        hide-details
        variant="solo"
        flat
        bg-color="rgba(255, 255, 255, 0.55)"
        placeholder="搜索游戏"
        prepend-inner-icon="mdi-magnify"
      />
      <div class="store-cats">
        <button
          v-for="item in categories"
          :key="item"
          class="store-cat"
          :class="{ on: category === item }"
          type="button"
          @click="category = item"
        >
          {{ item }}
        </button>
      </div>
    </div>

    <ul class="store-list">
      <li v-for="game in visibleGames" :key="game.id" class="store-item">
        <span class="store-icon">
          <v-icon :icon="game.icon" size="26" />
        </span>

        <div class="store-meta">
          <h3 class="store-name">{{ game.name }}</h3>
          <p class="store-sub">{{ game.developer }} · {{ game.category }} · {{ game.size }}</p>
          <p class="store-desc">{{ game.desc }}</p>
          <p class="store-rate">
            <v-icon icon="mdi-star" size="13" />
            {{ game.rating.toFixed(1) }}
            <span v-if="installedGames.includes(game.id)" class="store-badge">
              <v-icon icon="mdi-check-circle-outline" size="13" />
              已安装
            </span>
          </p>
        </div>

        <div class="store-action">
          <template v-if="progressOf(game.id) !== undefined">
            <v-progress-linear
              :model-value="progressOf(game.id)"
              height="5"
              rounded
              color="#3d2b0e"
              bg-color="rgba(61, 43, 14, 0.16)"
            />
            <span class="store-pct">下载中 {{ progressOf(game.id) }}%</span>
          </template>

          <template v-else-if="installedGames.includes(game.id)">
            <v-btn class="store-get" variant="flat" size="small" @click="desktop.playGame(game.id)">
              打开
            </v-btn>
            <v-btn class="store-del" variant="text" size="small" @click="desktop.uninstallGame(game.id)">
              卸载
            </v-btn>
          </template>

          <v-btn v-else class="store-get" variant="flat" size="small" @click="desktop.installGame(game.id)">
            获取
          </v-btn>
        </div>
      </li>
    </ul>

    <p v-if="!visibleGames.length" class="store-empty">没有匹配「{{ query }}」的游戏</p>
  </div>
</template>

<style scoped>
.store {
  display: flex;
  flex-direction: column;
  height: min(430px, 56dvh);
  padding: 12px 16px 14px;
}

.store-tools {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 12px;
}

.store-cats {
  display: flex;
  gap: 6px;
}

.store-cat {
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

.store-cat:hover {
  color: var(--text);
}

.store-cat.on {
  border-color: color-mix(in srgb, var(--accent) 55%, transparent);
  background: color-mix(in srgb, var(--accent) 18%, rgba(255, 255, 255, 0.6));
  color: var(--text);
}

.store-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  list-style: none;
  margin: 0;
  padding: 0 2px 0 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.store-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 12px 11px;
  border: 1px solid var(--ink-line);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.45);
}

.store-icon {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 13px;
  background: color-mix(in srgb, var(--accent) 16%, rgba(255, 255, 255, 0.65));
  color: var(--accent);
}

.store-meta {
  flex: 1 1 auto;
  min-width: 0;
}

.store-name {
  margin: 0 0 2px;
  font-family: var(--display-font);
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text);
}

.store-sub {
  margin: 0 0 4px;
  font-size: 11px;
  color: var(--text-muted);
}

.store-desc {
  margin: 0 0 5px;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--text-muted);
}

.store-rate {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  font-size: 11.5px;
  color: var(--text-muted);
}

.store-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-inline-start: 6px;
  padding: 1px 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 16%, transparent);
  color: var(--accent);
}

.store-action {
  flex: 0 0 84px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
}

.store-get {
  background: var(--accent);
  color: #fffdf5;
}

.store-del {
  color: var(--text-muted);
}

.store-pct {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
}

.store-empty {
  margin: 10px 2px;
  font-size: 12.5px;
  color: var(--text-muted);
}
</style>
