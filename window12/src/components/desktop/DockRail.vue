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
    <aside v-if="dockedPanels.length" class="dock glass-dense" aria-label="右侧任务栏">
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

/* M3 厚玻璃，材质与圆角全部交给 .glass-dense —— 设置里的滑块对它同样生效 */
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
  border: 1px solid var(--glass-edge);
  border-radius: 50%;
  background: var(--glass-thin);
  color: var(--text);
  cursor: pointer;
  transition:
    background-color var(--dur-2) var(--spring-settle),
    border-color var(--dur-2) var(--spring-settle),
    box-shadow var(--dur-2) var(--spring-settle),
    transform var(--dur-2) var(--spring-jelly);
}

/* hover-lift：向左抬起（这条栏贴在右边） */
.dock-item:hover {
  border-color: var(--glass-edge-strong);
  background: var(--glass-solid);
  box-shadow: var(--shadow-1);
  transform: translateX(-3px) scale(1.08);
}

.dock-item:active {
  transform: scale(0.92);
  transition-duration: var(--dur-1);
}

/* 任务视图开着时给个强调色圆点，和任务栏图标一致 */
.dock-item.running::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 50%;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px color-mix(in srgb, var(--accent) 70%, transparent);
  translate: -50% 0;
}

.dock-sep {
  width: 22px;
  height: 1px;
  background: var(--ink-200);
}

/* 整条栏出现 / 消失 */
.rail-enter-active,
.rail-leave-active {
  transition:
    opacity var(--dur-3) var(--spring-out),
    transform var(--dur-3) var(--spring-jelly);
}

.rail-enter-from,
.rail-leave-to {
  opacity: 0;
  transform: translate(18px, -50%) scale(0.94);
}

/* 收到右侧的图标：淡入 + 从左滑入 */
.dock-enter-active {
  transition:
    opacity var(--dur-3) var(--spring-out),
    transform var(--dur-3) var(--spring-jelly);
}

.dock-leave-active {
  transition:
    opacity var(--dur-2) var(--spring-out),
    transform var(--dur-2) var(--spring-settle);
}

.dock-enter-from,
.dock-leave-to {
  opacity: 0;
  transform: translateX(26px) scale(0.8);
}
</style>
