<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, nextTick, ref } from 'vue'
import { games, useDesktopStore } from '../stores/desktop'

const desktop = useDesktopStore()
const { installedGames, installing } = storeToRefs(desktop)
const user = desktop.user

type TabId = 'home' | 'manage'

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'home', label: '主页', icon: 'mdi-home-outline' },
  { id: 'manage', label: '应用管理', icon: 'mdi-package-variant-closed' },
]

const tab = ref<TabId>('home')
const view = ref<'list' | 'grid'>('list')
const category = ref('全部')
const categories = ['全部', ...new Set(games.map((game) => game.category))]

/* 搜索：点开后整块虚化，输入框展开并浮出结果 */
const searchOpen = ref(false)
const query = ref('')
const searchField = ref<{ focus: () => void } | null>(null)

const catalog = computed(() =>
  games.filter((game) => category.value === '全部' || game.category === category.value),
)
const installed = computed(() => games.filter((game) => installedGames.value.includes(game.id)))
const results = computed(() => games.filter((game) => game.name.includes(query.value.trim())))
const totalSize = computed(() =>
  installed.value
    .reduce((sum, game) => sum + (Number.parseFloat(game.size) || 0), 0)
    .toFixed(1),
)

function progressOf(id: string) {
  return installing.value[id]
}

function openSearch() {
  if (searchOpen.value) return
  searchOpen.value = true
  tab.value = 'home'
  nextTick(() => searchField.value?.focus())
}

function closeSearch() {
  searchOpen.value = false
  query.value = ''
}

function openGame(id: string) {
  desktop.playGame(id)
  closeSearch()
}

function pickTab(id: TabId) {
  tab.value = id
  closeSearch()
}
</script>

<template>
  <div class="store">
    <!-- 左上角：当前用户 -->
    <div class="store-account">
      <span class="store-avatar">{{ user.initial }}</span>
      <span class="store-who">{{ user.name }}</span>
    </div>

    <!-- 头像右边（与右栏对齐）：搜索栏 + 视图图标 -->
    <div class="store-tools">
      <div class="store-search" :class="{ on: searchOpen }">
        <v-text-field
          ref="searchField"
          v-model="query"
          class="glass-field"
          density="compact"
          hide-details
          variant="solo"
          flat
          bg-color="rgba(255, 255, 255, 0.55)"
          placeholder="搜索游戏"
          prepend-inner-icon="mdi-magnify"
          @focus="openSearch"
          @click="openSearch"
          @keydown.esc="closeSearch"
        />
        <button
          v-if="searchOpen"
          class="store-clear"
          type="button"
          aria-label="退出搜索"
          @click="closeSearch"
        >
          <v-icon icon="mdi-close" size="14" />
        </button>
      </div>

      <button
        class="store-tool"
        type="button"
        :aria-label="view === 'list' ? '切换网格视图' : '切换列表视图'"
        @click="view = view === 'list' ? 'grid' : 'list'"
      >
        <v-icon
          :icon="view === 'list' ? 'mdi-view-grid-outline' : 'mdi-view-list-outline'"
          size="17"
        />
      </button>
    </div>

    <!-- 左侧栏：主页 / 应用管理 -->
    <nav class="store-side">
      <button
        v-for="item in tabs"
        :key="item.id"
        class="store-tab"
        :class="{ on: tab === item.id }"
        type="button"
        @click="pickTab(item.id)"
      >
        <v-icon :icon="item.icon" size="16" />
        <span>{{ item.label }}</span>
      </button>
      <p class="store-side-note">已安装 {{ installedGames.length }} 个应用</p>
    </nav>

    <!-- 右栏：内容 -->
    <section class="store-body">
      <template v-if="tab === 'home'">
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

        <ul class="store-list" :class="{ grid: view === 'grid' }">
          <li v-for="game in catalog" :key="game.id" class="store-item">
            <span class="store-icon">
              <v-icon :icon="game.icon" size="24" />
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
                <span class="store-pct">{{ progressOf(game.id) }}%</span>
              </template>

              <template v-else-if="installedGames.includes(game.id)">
                <v-btn class="store-get" variant="flat" size="small" @click="openGame(game.id)">
                  打开
                </v-btn>
                <v-btn
                  class="store-del"
                  variant="text"
                  size="small"
                  @click="desktop.uninstallGame(game.id)"
                >
                  卸载
                </v-btn>
              </template>

              <v-btn
                v-else
                class="store-get"
                variant="flat"
                size="small"
                @click="desktop.installGame(game.id)"
              >
                获取
              </v-btn>
            </div>
          </li>
        </ul>
      </template>

      <template v-else>
        <p class="store-sum">
          已安装 {{ installed.length }} 个应用 · 共 {{ totalSize }} MB
        </p>

        <ul class="store-list" :class="{ grid: view === 'grid' }">
          <li v-for="game in installed" :key="game.id" class="store-item">
            <span class="store-icon">
              <v-icon :icon="game.icon" size="24" />
            </span>

            <div class="store-meta">
              <h3 class="store-name">{{ game.name }}</h3>
              <p class="store-sub">{{ game.developer }} · {{ game.size }} · 已装在本机</p>
            </div>

            <div class="store-action">
              <v-btn class="store-get" variant="flat" size="small" @click="openGame(game.id)">
                打开
              </v-btn>
              <v-btn
                class="store-del"
                variant="text"
                size="small"
                @click="desktop.uninstallGame(game.id)"
              >
                卸载
              </v-btn>
            </div>
          </li>
        </ul>

        <p v-if="!installed.length" class="store-empty">还没有安装应用，去「主页」挑一个吧。</p>
      </template>
    </section>

    <!-- 搜索态：整块遮罩虚化 + 浮出结果 -->
    <div v-if="searchOpen" class="store-scrim" @click="closeSearch"></div>

    <section v-if="searchOpen" class="store-results" aria-label="搜索结果">
      <ul class="store-hits">
        <li v-for="game in results" :key="game.id" class="store-hit">
          <span class="store-icon small">
            <v-icon :icon="game.icon" size="20" />
          </span>
          <div class="store-meta">
            <h3 class="store-name">{{ game.name }}</h3>
            <p class="store-sub">{{ game.developer }} · {{ game.size }} · ★ {{ game.rating.toFixed(1) }}</p>
          </div>

          <v-progress-linear
            v-if="progressOf(game.id) !== undefined"
            class="store-hit-bar"
            :model-value="progressOf(game.id)"
            height="4"
            rounded
            color="#3d2b0e"
            bg-color="rgba(61, 43, 14, 0.16)"
          />
          <v-btn
            v-else-if="installedGames.includes(game.id)"
            class="store-get"
            variant="flat"
            size="small"
            @click="openGame(game.id)"
          >
            打开
          </v-btn>
          <v-btn
            v-else
            class="store-get"
            variant="flat"
            size="small"
            @click="desktop.installGame(game.id)"
          >
            获取
          </v-btn>
        </li>
      </ul>

      <p v-if="!results.length" class="store-empty">没有找到「{{ query }}」</p>
    </section>
  </div>
</template>

<style scoped>
/* 左右 3 : 7，顶栏的搜索与右栏对齐 */
.store {
  position: relative;
  display: grid;
  grid-template-columns: 3fr 7fr;
  grid-template-rows: auto 1fr;
  column-gap: 14px;
  row-gap: 12px;
  height: min(440px, 58dvh);
  padding: 14px 16px 16px;
}

.store-account,
.store-tools,
.store-results {
  /* 顶栏与结果面板要压在遮罩之上，保持清晰 */
  position: relative;
  z-index: 3;
}

.store-account {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.store-avatar {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent);
  color: #fffdf5;
  font-family: var(--display-font);
  font-weight: 700;
  font-size: 14px;
}

.store-who {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.store-tools {
  display: flex;
  align-items: center;
}

/* 收起时是窄搜索框，点开后展开铺满右栏宽度 */
.store-search {
  position: relative;
  width: 200px;
  max-width: 100%;
  transition: width 0.32s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.store-search.on {
  width: 100%;
}

.store-clear {
  position: absolute;
  top: 50%;
  inset-inline-end: 8px;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgba(61, 43, 14, 0.14);
  color: var(--text);
  cursor: pointer;
}

.store-clear:hover {
  background: rgba(61, 43, 14, 0.24);
}

.store-tool {
  flex: 0 0 auto;
  margin-inline-start: 8px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(61, 43, 14, 0.14);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.45);
  color: var(--text);
  cursor: pointer;
  transition: background 0.2s ease;
}

.store-tool:hover {
  background: rgba(255, 255, 255, 0.75);
}

/* 左侧栏 */
.store-side {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-inline-end: 4px;
  border-inline-end: 1px solid var(--ink-line);
}

.store-tab {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 11px;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--body-font);
  font-size: 12.5px;
  text-align: start;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}

.store-tab:hover {
  background: rgba(255, 255, 255, 0.5);
  color: var(--text);
}

.store-tab.on {
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
  background: color-mix(in srgb, var(--accent) 16%, rgba(255, 255, 255, 0.55));
  color: var(--text);
}

.store-side-note {
  margin: auto 2px 0;
  font-size: 11px;
  color: var(--text-muted);
}

/* 右栏 */
.store-body {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.store-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-bottom: 10px;
}

.store-cat {
  padding: 4px 11px;
  border: 1px solid rgba(61, 43, 14, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.45);
  color: var(--text-muted);
  font-family: var(--body-font);
  font-size: 11.5px;
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

.store-sum {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--text-muted);
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
  gap: 11px;
  padding: 11px 11px 10px;
  border: 1px solid var(--ink-line);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.45);
}

.store-icon {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: color-mix(in srgb, var(--accent) 16%, rgba(255, 255, 255, 0.65));
  color: var(--accent);
}

.store-icon.small {
  width: 36px;
  height: 36px;
  border-radius: 11px;
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

/* 网格视图 */
.store-list.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-content: start;
}

.store-list.grid .store-item {
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.store-list.grid .store-desc {
  display: none;
}

.store-list.grid .store-action {
  flex: 0 0 auto;
  flex-direction: row;
  align-items: center;
  width: 100%;
}

.store-empty {
  margin: 10px 2px;
  font-size: 12.5px;
  color: var(--text-muted);
}

/* 搜索态：遮罩把下面整块虚化，结果浮在最上层 */
.store-scrim {
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: calc(var(--radius) - 4px);
  background: rgba(255, 253, 245, 0.42);
  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(7px);
  cursor: pointer;
}

.store-results {
  grid-area: 2 / 2;
  align-self: stretch;
  min-height: 0;
  overflow: auto;
  padding: 2px 2px 0;
}

.store-hits {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.store-hit {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--ink-line);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.72);
  animation: hit-in 0.2s ease both;
}

.store-hit-bar {
  flex: 0 0 64px;
}

@keyframes hit-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
