<script setup lang="ts">
import { onKeyStroke, useEventListener } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref, type ComponentPublicInstance } from 'vue'
import { useTaskbarDrag } from '../../composables/useTaskbarDrag'
import { useTaskbarReorder } from '../../composables/useTaskbarReorder'
import { taskbarItems } from '../../data/apps'
import { useDesktopStore } from '../../stores/desktop'
import { usePlayerStore } from '../../stores/player'
import type { TaskbarItem } from '../../types/desktop'

/* 任务栏：左边固定 Win 与搜索，中间是可拖动排序的应用按钮，右端是播放中的音乐律动 */
const desktop = useDesktopStore()
const player = usePlayerStore()
const { panels, docked, accountBarOpen, searchOpen, taskbarOrder } = storeToRefs(desktop)
const { toggleDock, openSearch, powerOff, notify, moveTaskbarItem } = desktop

/* 头像来自在线插画服务，取不到时退回姓氏文字 */
const avatarsOk = ref(true)

function toggleAccountBar() {
  accountBarOpen.value = !accountBarOpen.value
}

/* 按 store 里的顺序渲染按钮 */
const items = computed(() =>
  taskbarOrder.value
    .map((id) => taskbarItems.find((item) => item.id === id))
    .filter((item): item is TaskbarItem => Boolean(item)),
)

/* 拖动排序：落在哪个槽位就吸附到哪 */
const listEl = ref<ComponentPublicInstance | HTMLElement | null>(null)
const { draggingId, startItemDrag, moveItem, endItemDrag, consumeClick: wasDragging } =
  useTaskbarReorder({ listEl, onMove: moveTaskbarItem })

function activate(item: TaskbarItem) {
  /* 刚拖动过就别当成点击 */
  if (wasDragging()) return
  if (item.panel) {
    toggleDock(item.panel)
    return
  }
  notify(`${item.label} 正在开发中`)
}

const { taskbarEl, barHidden, barDragging, barStyle, startBarDrag, onBarClick, onBarKey } =
  useTaskbarDrag({
    onEmptyClick: () => {
      accountBarOpen.value = false
    },
  })

/* 从按钮上按下的不算"整条向下收起"，否则横向拖排序会被误判 */
function onBarPointerDown(event: PointerEvent) {
  if ((event.target as HTMLElement).closest('.tb-item')) return
  startBarDrag(event)
}

/* 点任务栏以外的任何地方、或按 Esc，都退回普通任务栏。
   监听常驻即可（只有账号态才响应），VueUse 负责在卸载时清理。 */
useEventListener(
  document,
  'mousedown',
  (event) => {
    if (!accountBarOpen.value) return
    if (taskbarEl.value?.contains(event.target as Node)) return
    accountBarOpen.value = false
  },
  { capture: true },
)

onKeyStroke('Escape', () => {
  if (accountBarOpen.value) accountBarOpen.value = false
})
</script>

<template>
      <footer
      ref="taskbarEl"
      class="taskbar glass"
      :class="{ 'is-hidden': barHidden, dragging: barDragging, account: accountBarOpen }"
      :style="barStyle"
      :tabindex="barHidden ? 0 : -1"
      :aria-label="barHidden ? '任务栏已收起，点击或按回车展开' : undefined"
      @click="onBarClick"
      @pointerdown="onBarPointerDown"
      @keydown="onBarKey"
    >
      <button
        class="tb-btn tb-start"
        type="button"
        aria-label="开始"
        :aria-expanded="accountBarOpen"
        @click.stop="toggleAccountBar()"
      >
        <v-icon icon="mdi-microsoft-windows" size="20" />
      </button>

      <!-- 账号态：整条任务栏只剩头像与关机 -->
      <template v-if="accountBarOpen">
        <span class="tb-avatar" :aria-label="`当前账号 ${desktop.user.name}`">
          <img v-if="avatarsOk" :src="desktop.user.avatar" alt="" @error="avatarsOk = false" />
          <template v-else>{{ desktop.user.initial }}</template>
        </span>
        <button class="tb-btn tb-power" type="button" aria-label="关机" @click="powerOff()">
          <v-icon icon="mdi-power" size="20" />
        </button>
      </template>

      <!-- 默认态：搜索 + 可拖动排序的应用 + 音乐律动 -->
      <template v-else>
        <button
          class="tb-search"
          type="button"
          aria-label="搜索"
          :aria-expanded="searchOpen"
          @click="openSearch()"
        >
          <v-icon icon="mdi-magnify" size="15" />
          <span>搜索</span>
        </button>

        <TransitionGroup ref="listEl" name="tb" tag="div" class="tb-items" aria-label="任务栏应用">
          <button
            v-for="item in items"
            :key="item.id"
            class="tb-btn tb-item"
            :class="{
              running: !!item.panel && panels[item.panel],
              docked: !!item.panel && docked[item.panel],
              dragging: draggingId === item.id,
            }"
            type="button"
            :data-item-id="item.id"
            :aria-label="item.label"
            :title="item.label"
            @pointerdown="startItemDrag(item.id, $event)"
            @pointermove="moveItem"
            @pointerup="endItemDrag"
            @pointercancel="endItemDrag"
            @click="activate(item)"
          >
            <v-icon :icon="item.icon" size="20" />
          </button>
        </TransitionGroup>

        <!-- 播放中：音乐律动 -->
        <button
          v-if="player.playing"
          class="tb-eq"
          type="button"
          :title="`正在播放 ${player.current.title}`"
          aria-label="正在播放，点开音乐"
          @click="toggleDock('music')"
        >
          <span class="tb-eq-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          <span class="tb-eq-title">{{ player.current.title }}</span>
        </button>
      </template>
    </footer>
</template>

<style scoped>
/* ---------------------------------- 任务栏 --------------------------------- */

/* 贴在左下角，80% 透明（只留两成白），靠更厚的背景模糊顶住可读性 */
.taskbar {
  position: fixed;
  left: 24px;
  bottom: var(--taskbar-bottom);
  z-index: 80;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 7px 10px;
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(30px) saturate(170%);
  -webkit-backdrop-filter: blur(30px) saturate(170%);
  user-select: none;
  transition: transform 0.34s cubic-bezier(0.22, 0.8, 0.24, 1);
}



/* 入场只动 translate，把 transform 留给拖拽与收起 */

/* 向下拖拽中要跟手，不要过渡 */
.taskbar.dragging {
  transition: none;
}

/* 收起：只留底部一小截，鼠标移上去再抬一点作为可点击的提示 */
.taskbar.is-hidden {
  transform: translateY(calc(100% + var(--taskbar-bottom) - var(--taskbar-sliver)));
  cursor: pointer;
}

.taskbar.is-hidden > * {
  pointer-events: none;
  visibility: hidden;
}

.taskbar.is-hidden:hover {
  transform: translateY(calc(100% + var(--taskbar-bottom) - var(--taskbar-sliver) - 8px));
}

.taskbar.is-hidden::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 3px;
  border-radius: 3px;
  background: var(--ink-line);
}

.tb-btn {
  position: relative;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.tb-btn:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: var(--ink-line);
}

.tb-btn.running::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 3px;
  border-radius: 3px;
  background: var(--accent);
}

.tb-search {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid var(--ink-line);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  color: var(--text);
  font-family: var(--body-font);
  font-size: 12.5px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.tb-search:hover {
  background: rgba(255, 255, 255, 0.8);
}

.tb-btn.docked {
  opacity: 0.55;
}


/* ---------------------------- 任务栏的账号/电源态 ---------------------------- */

.tb-avatar {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  margin-inline: 2px 4px;
  overflow: hidden;
  border: 1px solid var(--ink-line);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.78);
  color: var(--text);
  font-family: var(--display-font);
  font-size: 13px;
  font-weight: 700;
  animation: rise-account 0.34s cubic-bezier(0.16, 0.84, 0.28, 1) both;
}

.tb-avatar img {
  display: block;
  width: 100%;
  height: 100%;
}

.tb-power {
  width: 38px;
  height: 38px;
  animation: rise-account 0.34s cubic-bezier(0.16, 0.84, 0.28, 1) 0.04s both;
}

@keyframes rise-account {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: none;
  }
}


/* --------------------------------- 窄屏回退 -------------------------------- */

@media (max-width: 1000px) {
  .tb-search span,
  .tb-eq-title {
    display: none;
  }

  /* 窄屏不支持拖拽收起，避免出现收不回来的状态 */
  .taskbar.is-hidden {
    transform: none;
  }
}

@media (max-width: 640px) {
  .tb-search {
    padding: 0 12px;
  }
}

/* --------------------------- 应用按钮：拖动排序 --------------------------- */

.tb-items {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tb-item {
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.tb-item.dragging {
  cursor: grabbing;
  background: rgba(255, 255, 255, 0.95);
  border-color: var(--accent);
  transform: scale(1.08);
  box-shadow: 0 8px 18px rgba(140, 100, 30, 0.28);
}

/* 换位时按钮滑向新槽位，看起来就是"吸附拼接" */
.tb-move {
  transition: transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* ------------------------------- 音乐律动 ------------------------------- */

.tb-eq {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  max-width: 148px;
  margin-inline-start: 4px;
  padding: 0 12px;
  border: 1px solid var(--ink-line);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.55);
  color: var(--text);
  font-family: var(--body-font);
  cursor: pointer;
}

.tb-eq-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 14px;
}

.tb-eq-bars i {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: var(--accent);
  transform: scaleY(0.3);
  transform-origin: bottom;
  animation: tb-eq 0.9s ease-in-out infinite;
}

.tb-eq-bars i:nth-child(2) {
  animation-delay: 0.16s;
}

.tb-eq-bars i:nth-child(3) {
  animation-delay: 0.32s;
}

.tb-eq-bars i:nth-child(4) {
  animation-delay: 0.48s;
}

@keyframes tb-eq {
  0%,
  100% {
    transform: scaleY(0.3);
  }
  50% {
    transform: scaleY(1);
  }
}

.tb-eq-title {
  overflow: hidden;
  font-size: 11.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
