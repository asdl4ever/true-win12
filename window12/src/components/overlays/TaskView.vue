<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { PANEL_ICON, PANEL_LABEL } from '../../data/apps'
import { games } from '../../data/games'
import { useDesktopStore } from '../../stores/desktop'
import type { PanelId } from '../../types/desktop'

const desktop = useDesktopStore()
const { openPanels, docked, frontPanel, activeGame } = storeToRefs(desktop)

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

/* Esc 先关任务视图，再兜底关任务栏的账号态（本组件的监听随它挂载/卸载） */
onKeyStroke('Escape', () => {
  if (desktop.taskViewOpen) desktop.closeTaskView()
  else if (desktop.accountBarOpen) desktop.accountBarOpen = false
})
</script>

<template>
  <section class="task-view" @click.self="desktop.closeTaskView()">
    <div class="tv-inner" @click.self="desktop.closeTaskView()">
      <header class="tv-head">
        <h2 class="tv-title">任务视图</h2>
        <p class="tv-hint">
          点卡片切到那个窗口；<b>Ctrl+`</b> 直接轮转窗口，<b>Esc</b> 关闭
        </p>
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
            @click.stop="desktop.closePanel(panel)"
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
    </div>
  </section>
</template>

<style scoped>
/* 桌面之上压一层冷调磨砂，任务栏（z-index 80）仍在它上面，方便再点一次收起 */
.task-view {
  position: fixed;
  inset: 0;
  z-index: 75;
  padding: 34px 40px 130px;
  overflow: auto;
  background: var(--scrim);
  backdrop-filter: blur(var(--blur)) saturate(140%);
  -webkit-backdrop-filter: blur(var(--blur)) saturate(140%);
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
  font-size: var(--fs-display);
  font-weight: var(--fw-bold);
  color: var(--text);
}

.tv-hint {
  margin: 0;
  font-size: var(--fs-label);
  color: var(--text-muted);
}

.tv-hint b {
  font-family: var(--display-font);
  font-weight: var(--fw-semi);
  color: var(--text);
}

.tv-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-family: var(--display-font);
  font-size: var(--fs-subtitle);
  font-weight: var(--fw-bold);
  color: var(--text);
}

.tv-count {
  padding: 1px 8px;
  border-radius: var(--r-pill);
  background: var(--glass-solid);
  font-size: var(--fs-caption);
  font-weight: var(--fw-semi);
  color: var(--text-muted);
}

.tv-big {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
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
  animation: jelly-rise var(--dur-5) var(--spring-out) both;
  animation-delay: var(--d, 0s);
  transition: border-color var(--dur-2) var(--spring-settle);
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
  border-radius: var(--r-control);
  background: var(--glass-solid);
  color: var(--text);
  opacity: 0;
  cursor: pointer;
  transition:
    opacity var(--dur-2) var(--spring-settle),
    background-color var(--dur-2) var(--spring-settle),
    color var(--dur-2) var(--spring-settle);
}

.tv-card:hover .tv-close,
.tv-close:focus-visible {
  opacity: 1;
}

.tv-close:hover {
  background: var(--danger);
  color: var(--on-danger);
}

.tv-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: var(--r-control);
  background: color-mix(in srgb, var(--accent) 16%, var(--glass-base));
  color: var(--accent-deep);
}

.tv-card-title {
  margin: 0;
  font-family: var(--display-font);
  font-size: var(--fs-subtitle);
  font-weight: var(--fw-bold);
  color: var(--text);
}

.tv-card-state {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: var(--fs-caption);
  color: var(--text-muted);
}

.tv-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

.tv-empty {
  margin: 4px 0 0;
  font-size: var(--fs-label);
  color: var(--text-muted);
}

/* 整层淡入淡出。不要在这里摘 backdrop-filter：
   整层背后是静止的桌面，滤镜结果可以复用，成本很低；
   摘掉会让桌面先清晰、等过渡结束才"突然"模糊，观感上就是"隔了一下才模糊处理"。 */
.tv-enter-active,
.tv-leave-active {
  transition: opacity var(--dur-3) var(--spring-settle);
}

.tv-enter-from,
.tv-leave-to {
  opacity: 0;
}
</style>
