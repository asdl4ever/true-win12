<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import {
  games,
  PANEL_ICON,
  PANEL_LABEL,
  useDesktopStore,
  type AppEntry,
  type PanelId,
} from '../stores/desktop'

const desktop = useDesktopStore()
const { openPanels, panels, docked, frontPanel, launchableApps, activeGame } = storeToRefs(desktop)

function isRunning(app: AppEntry) {
  if (app.game) return panels.value.arcade && activeGame.value === app.game
  return !!app.panel && panels.value[app.panel]
}

/* 未开启的应用：窗口没开着的、游戏没在玩的，加上本来就打不开的 */
const idleApps = computed(() => launchableApps.value.filter((app) => !isRunning(app)))

/* 游戏窗口的卡片直接显示正在玩的游戏名 */
function panelTitle(panel: PanelId) {
  if (panel === 'arcade') {
    const game = games.find((item) => item.id === activeGame.value)
    if (game) return `游戏 · ${game.name}`
  }
  return PANEL_LABEL[panel]
}

/* 大卡片的状态：当前窗口 / 已收到右侧 / 在后台 */
function panelState(panel: PanelId) {
  if (docked.value[panel]) return '已收到右侧'
  return panel === frontPanel.value ? '当前窗口' : '在后台'
}

function focusPanel(panel: PanelId) {
  desktop.restorePanel(panel)
  desktop.closeTaskView()
}

function launch(app: AppEntry) {
  if (app.game) {
    desktop.playGame(app.game)
    desktop.closeTaskView()
    return
  }
  if (app.panel) {
    desktop.openPanel(app.panel)
    desktop.raise(app.panel)
    desktop.closeTaskView()
    return
  }
  desktop.notify(`${app.label} 正在开发中`)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (desktop.taskViewOpen) desktop.closeTaskView()
  else if (desktop.startOpen) desktop.startOpen = false
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <section class="task-view" @click.self="desktop.closeTaskView()">
    <div class="tv-inner" @click.self="desktop.closeTaskView()">
      <header class="tv-head">
        <h2 class="tv-title">任务视图</h2>
        <p class="tv-hint">点大卡片切到那个窗口，点小卡片启动应用，Esc 关闭</p>
      </header>

      <h3 class="tv-section">
        正在运行
        <span class="tv-count">{{ openPanels.length }}</span>
      </h3>
      <div v-if="openPanels.length" class="tv-big">
        <article
          v-for="(panel, index) in openPanels"
          :key="panel"
          class="tv-card glass"
          role="group"
          tabindex="0"
          :style="{ '--d': `${index * 0.05}s` }"
          :aria-label="`${panelTitle(panel)}，${panelState(panel)}，回车切到前台`"
          @click="focusPanel(panel)"
          @keydown.enter.prevent="focusPanel(panel)"
          @keydown.space.prevent="focusPanel(panel)"
        >
          <button
            class="tv-close"
            type="button"
            :aria-label="`关闭 ${panelTitle(panel)}`"
            @click.stop="panels[panel] = false"
          >
            <v-icon icon="mdi-close" size="13" />
          </button>
          <span class="tv-icon">
            <v-icon :icon="PANEL_ICON[panel]" size="28" />
          </span>
          <h4 class="tv-card-title">{{ panelTitle(panel) }}</h4>
          <p class="tv-card-state">
            <span v-if="panel === frontPanel && !docked[panel]" class="tv-dot"></span>
            {{ panelState(panel) }}
          </p>
        </article>
      </div>
      <p v-else class="tv-empty">当前没有打开的窗口</p>

      <h3 class="tv-section">
        未开启的应用
        <span class="tv-count">{{ idleApps.length }}</span>
      </h3>
      <div class="tv-small">
        <button
          v-for="(app, index) in idleApps"
          :key="app.id"
          class="tv-mini glass"
          type="button"
          :style="{ '--d': `${0.06 + index * 0.04}s` }"
          @click="launch(app)"
        >
          <v-icon :icon="app.icon" size="22" />
          <span>{{ app.label }}</span>
        </button>
        <p v-if="!idleApps.length" class="tv-empty">所有应用都在运行</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* 桌面之上压一层暖调磨砂，任务栏（z-index 80）仍在它上面，方便再点一次收起 */
.task-view {
  position: fixed;
  inset: 0;
  z-index: 75;
  padding: 34px 40px 130px;
  overflow: auto;
  background: rgba(94, 66, 20, 0.3);
  backdrop-filter: blur(20px) saturate(120%);
  -webkit-backdrop-filter: blur(20px) saturate(120%);
}

.tv-inner {
  width: min(1160px, 100%);
  margin: 0 auto;
}

.tv-head {
  margin-bottom: 22px;
}

.tv-title {
  margin: 0 0 6px;
  font-family: var(--display-font);
  font-size: 21px;
  font-weight: 700;
  color: var(--text);
}

.tv-hint {
  margin: 0;
  font-size: 12.5px;
  color: rgba(61, 43, 14, 0.75);
}

.tv-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-family: var(--display-font);
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}

.tv-count {
  padding: 1px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.62);
  font-size: 11px;
  font-weight: 600;
  color: rgba(61, 43, 14, 0.8);
}

.tv-big {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 28px;
}

.tv-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 9px;
  width: min(268px, 28vw);
  min-height: 172px;
  padding: 20px 18px 16px;
  cursor: pointer;
  animation: tv-rise 0.5s cubic-bezier(0.16, 0.84, 0.28, 1) both;
  animation-delay: var(--d, 0s);
  transition: border-color 0.2s ease;
}

.tv-card:hover,
.tv-card:focus-visible {
  border-color: var(--accent);
}

.tv-close {
  position: absolute;
  top: 10px;
  inset-inline-end: 10px;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.75);
  color: var(--text);
  opacity: 0;
  cursor: pointer;
  transition:
    opacity 0.18s ease,
    background 0.18s ease,
    color 0.18s ease;
}

.tv-card:hover .tv-close,
.tv-close:focus-visible {
  opacity: 1;
}

.tv-close:hover {
  background: #e81123;
  color: #fff;
}

.tv-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--accent) 16%, rgba(255, 255, 255, 0.62));
  color: var(--accent);
}

.tv-card-title {
  margin: 0;
  font-family: var(--display-font);
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}

.tv-card-state {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 11.5px;
  color: var(--text-muted);
}

.tv-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

.tv-small {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tv-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 104px;
  padding: 14px 8px 12px;
  border-radius: calc(var(--radius) - 6px);
  color: var(--text);
  font-family: var(--body-font);
  font-size: 11.5px;
  line-height: 1.3;
  cursor: pointer;
  animation: tv-rise 0.5s cubic-bezier(0.16, 0.84, 0.28, 1) both;
  animation-delay: var(--d, 0s);
  transition: border-color 0.2s ease;
}

.tv-mini:hover,
.tv-mini:focus-visible {
  border-color: var(--accent);
}

.tv-empty {
  margin: 4px 0 0;
  font-size: 12.5px;
  color: rgba(61, 43, 14, 0.72);
}

@keyframes tv-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* 整层淡入淡出 */
.tv-enter-active,
.tv-leave-active {
  transition: opacity 0.24s ease;
}

.tv-enter-from,
.tv-leave-to {
  opacity: 0;
}
</style>
