<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { PANEL_ICON, PANEL_LABEL } from '../../data/apps'
import { useDesktopStore } from '../../stores/desktop'

/* 桌面右侧的任务栏：顶部是任务视图入口，下面是收到右侧的窗口。
   没有窗口收到右侧时整条隐藏。 */
const desktop = useDesktopStore()
const { dockedPanels, taskViewOpen } = storeToRefs(desktop)
const { restorePanel, toggleTaskView } = desktop
</script>

<template>
  <Transition name="rail">
    <aside v-if="dockedPanels.length" class="dock glass glass-dense" aria-label="右侧任务栏">
      <button
        class="dock-item dock-task"
        :class="{ running: taskViewOpen }"
        type="button"
        aria-label="任务视图"
        :aria-expanded="taskViewOpen"
        @click="toggleTaskView()"
      >
        <v-icon icon="mdi-view-dashboard-outline" size="20" />
      </button>

      <span class="dock-sep" aria-hidden="true"></span>

      <TransitionGroup name="dock" tag="div" class="dock-items">
        <button
          v-for="panel in dockedPanels"
          :key="panel"
          class="dock-item"
          type="button"
          :title="`呼出 ${PANEL_LABEL[panel]}`"
          :aria-label="`呼出 ${PANEL_LABEL[panel]}`"
          @click="restorePanel(panel)"
        >
          <v-icon :icon="PANEL_ICON[panel]" size="20" />
        </button>
      </TransitionGroup>
    </aside>
  </Transition>
</template>

<style scoped>
/* ------------------------------ 桌面右侧的任务栏 ----------------------------- */

.dock {
  position: fixed;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  /* 压在任务视图与搜索之上，任务栏（80）之下，保证入口随时可点 */
  z-index: 79;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 7px;
  border-radius: calc(var(--radius) - 2px);
}

.dock-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dock-item {
  position: relative;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.5);
  color: var(--text);
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.dock-item:hover {
  border-color: var(--ink-line);
  background: rgba(255, 255, 255, 0.95);
}

/* 任务视图开着时给个强调色短横，和任务栏图标一致 */
.dock-item.running::after {
  content: '';
  position: absolute;
  bottom: 3px;
  left: 50%;
  width: 12px;
  height: 3px;
  border-radius: 3px;
  background: var(--accent);
  translate: -50% 0;
}

.dock-sep {
  width: 22px;
  height: 1px;
  background: var(--ink-line);
}

/* 整条栏出现 / 消失 */
.rail-enter-active,
.rail-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.rail-enter-from,
.rail-leave-to {
  opacity: 0;
  transform: translate(18px, -50%) scale(0.94);
}

/* 收到右侧的图标：淡入 + 从左滑入 */
.dock-enter-active {
  transition:
    opacity 0.22s ease,
    transform 0.26s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.dock-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.18s ease;
}

.dock-enter-from,
.dock-leave-to {
  opacity: 0;
  transform: translateX(26px) scale(0.8);
}
</style>
