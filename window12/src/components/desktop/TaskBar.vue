<script setup lang="ts">
import { onKeyStroke, useEventListener } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, nextTick, ref, watch, type ComponentPublicInstance } from 'vue'
import { useTaskbarDrag } from '../../composables/useTaskbarDrag'
import { useTaskbarReorder } from '../../composables/useTaskbarReorder'
import { taskbarItems } from '../../data/apps'
import { useDesktopStore } from '../../stores/desktop'
import { usePlayerStore } from '../../stores/player'
import type { TaskbarItem } from '../../types/desktop'

/* 任务栏：左边固定 Win 与搜索，中间是可拖动排序的应用按钮，右端是播放中的音乐律动 */
const desktop = useDesktopStore()
const player = usePlayerStore()
const { panels, docked, accountBarOpen, searchOpen, taskbarOrder, accountList } =
  storeToRefs(desktop)
const { toggleDock, openSearch, powerOff, notify, moveTaskbarItem } = desktop

/* 头像来自在线插画服务，取不到时退回姓氏文字 */
const avatarsOk = ref(true)

/* 账号态里点开头像后浮出的切换面板 */
const switcherOpen = ref(false)

function toggleAccountBar() {
  accountBarOpen.value = !accountBarOpen.value
  switcherOpen.value = false
}

/* 选中某个账号：切过去并收起面板 */
function pickUser(account: (typeof accountList.value)[number]) {
  desktop.switchUser(account)
  switcherOpen.value = false
}

/* 删除账号：叉号走 store 的规则（至少留一个） */
function deleteUser(account: (typeof accountList.value)[number]) {
  desktop.removeUser(account.id)
}

/* 换账号后重新给头像一次加载机会（之前失败的图不该一直空着） */
watch(
  () => desktop.user.id,
  () => {
    avatarsOk.value = true
  },
)

/* 新增账号：开内置弹框，确认后建号并切过去 */
const newUserOpen = ref(false)
const newName = ref('')
const nameInput = ref<HTMLInputElement | null>(null)

function openNewUser() {
  newName.value = ''
  newUserOpen.value = true
  nextTick(() => nameInput.value?.focus())
}

function closeNewUser() {
  newUserOpen.value = false
}

/* 点卡片上除弹框外的区域，收起新增弹框 */
function onPanelClick() {
  if (newUserOpen.value) newUserOpen.value = false
}

function confirmNewUser() {
  const name = newName.value.trim()
  if (!name) return
  desktop.addUser(name)
  newUserOpen.value = false
  switcherOpen.value = false
}

/* 插画头像取不到时，直接藏掉图片，露出底下的姓氏文字 */
function hideBrokenAvatar(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

/* 按 store 里的顺序渲染按钮 */
const items = computed(() =>
  taskbarOrder.value
    .map((id) => taskbarItems.find((item) => item.id === id))
    .filter((item): item is TaskbarItem => Boolean(item)),
)

/* 拖动排序：落在哪个槽位就吸附到哪 */
const listEl = ref<ComponentPublicInstance | HTMLElement | null>(null)
const { draggingId, dragDx, startItemDrag, moveItem, endItemDrag, consumeClick: wasDragging } =
  useTaskbarReorder({ listEl, onMove: moveTaskbarItem })

/* 点击应用时图标弹跳一下，动画播完由模板清掉这个标记 */
const bouncingId = ref<string | null>(null)

function activate(item: TaskbarItem) {
  /* 刚拖动过就别当成点击 */
  if (wasDragging()) return
  bouncingId.value = item.id
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
    switcherOpen.value = false
  },
  { capture: true },
)

onKeyStroke('Escape', () => {
  if (newUserOpen.value) newUserOpen.value = false
  else if (switcherOpen.value) switcherOpen.value = false
  else if (accountBarOpen.value) accountBarOpen.value = false
})
</script>

<template>
      <footer
      ref="taskbarEl"
      class="taskbar glass-dense"
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
        <button
          class="tb-avatar"
          type="button"
          :aria-label="`当前账号 ${desktop.user.name}，点击切换或新增账号`"
          :aria-expanded="switcherOpen"
          @click.stop="switcherOpen = !switcherOpen"
          @pointerdown.stop
        >
          <img v-if="avatarsOk" :src="desktop.user.avatar" alt="" @error="avatarsOk = false" />
          <template v-else>{{ desktop.user.initial }}</template>
        </button>

        <!-- 点开头像浮出的账号面板：切换已有账号 / 新增账号 -->
        <div
          v-if="switcherOpen"
          class="tb-users glass glass-dense"
          :class="{ 'is-blurred': newUserOpen }"
          @click.stop="onPanelClick"
          @pointerdown.stop
        >
          <div class="tb-users-body">
            <p class="tb-users-title">切换账号</p>
            <div
              v-for="account in accountList"
              :key="account.id"
              class="tu-item"
              :class="{ on: account.id === desktop.user.id }"
            >
              <button class="tu-pick" type="button" @click.stop="pickUser(account)">
                <span class="tu-avatar">
                  {{ account.initial }}
                  <img :src="account.avatar" alt="" @error="hideBrokenAvatar" />
                </span>
                <span class="tu-name">{{ account.name }}</span>
                <span class="tu-role">{{ account.role }}</span>
              </button>
              <button
                class="tu-del"
                type="button"
                :aria-label="`删除账号 ${account.name}`"
                @click.stop="deleteUser(account)"
              >
                <v-icon icon="mdi-close" size="14" />
              </button>
            </div>
            <button class="tu-add" type="button" @click.stop="openNewUser">
              <v-icon icon="mdi-account-plus-outline" size="16" />
              <span>新增账号</span>
            </button>
          </div>

          <!-- 新增账号：盖住原卡片约 8 成区域的小卡片，背后的账号面板整体模糊 -->
          <Transition name="udfade">
            <section
              v-if="newUserOpen"
              class="ud"
              role="dialog"
              aria-label="新增账号"
              @click.stop
              @pointerdown.stop
            >
              <h2 class="ud-title">新增账号</h2>
              <input
                ref="nameInput"
                v-model="newName"
                class="ud-input"
                type="text"
                maxlength="12"
                placeholder="账号名称"
                @keydown.enter.prevent.stop="confirmNewUser"
              />
              <div class="ud-actions">
                <button class="ud-btn" type="button" @click.stop="closeNewUser">取消</button>
                <button
                  class="ud-btn primary"
                  type="button"
                  :disabled="!newName.trim()"
                  @click.stop="confirmNewUser"
                >
                  创建
                </button>
              </div>
            </section>
          </Transition>
        </div>

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
              bouncing: bouncingId === item.id,
            }"
            :style="draggingId === item.id ? `--dx:${dragDx}px` : undefined"
            type="button"
            :data-item-id="item.id"
            :aria-label="item.label"
            :title="item.label"
            @pointerdown="startItemDrag(item.id, $event)"
            @pointermove="moveItem"
            @pointerup="endItemDrag"
            @pointercancel="endItemDrag"
            @animationend="bouncingId = null"
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

/* 贴在左下角：M3 厚玻璃。背景、模糊、圆角、阴影全部交给 .glass-dense，
   这里只管布局与位置——材质不再被组件覆盖，设置里的模糊/圆角滑块才管得住它 */
.taskbar {
  position: fixed;
  left: 24px;
  bottom: var(--taskbar-bottom);
  z-index: 80;
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  padding: var(--sp-2) var(--sp-3);
  user-select: none;
  transition: transform var(--dur-4) var(--spring-settle);
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
  border-radius: 50%;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  transition:
    background-color var(--dur-2) var(--spring-settle),
    border-color var(--dur-2) var(--spring-settle),
    box-shadow var(--dur-2) var(--spring-settle),
    transform var(--dur-2) var(--spring-jelly);
}

/* hover-lift：抬起来并轻微放大 */
.tb-btn:hover {
  background: var(--glass-solid);
  border-color: var(--glass-edge-strong);
  box-shadow: var(--shadow-1);
  transform: translateY(-2px) scale(1.05);
}

/* press-squash：按下去压扁，松手弹回过冲 */
.tb-btn:active {
  transform: scale(0.92);
  transition-duration: var(--dur-1);
}

/* 运行中：底部一颗小圆点，visionOS 的"在线"标记语言 */
.tb-btn.running::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px color-mix(in srgb, var(--accent) 70%, transparent);
}

.tb-search {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid var(--glass-edge);
  border-radius: var(--r-pill);
  background: var(--glass-thin);
  color: var(--text);
  font-family: var(--body-font);
  font-size: var(--fs-label);
  cursor: pointer;
  transition:
    background-color var(--dur-2) var(--spring-settle),
    box-shadow var(--dur-2) var(--spring-settle),
    transform var(--dur-2) var(--spring-jelly);
}

.tb-search:hover {
  background: var(--glass-solid);
  box-shadow: var(--shadow-1);
  transform: scale(1.04);
}

.tb-search:active {
  transform: scale(0.95);
  transition-duration: var(--dur-1);
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
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--glass-edge-strong);
  border-radius: 50%;
  background: var(--glass-solid);
  color: var(--text);
  font-family: var(--display-font);
  font-size: var(--fs-body);
  font-weight: var(--fw-bold);
  cursor: pointer;
  animation: rise-account var(--dur-4) var(--spring-out) both;
  transition:
    box-shadow var(--dur-2) var(--spring-settle),
    transform var(--dur-2) var(--spring-jelly);
}

.tb-avatar:hover {
  box-shadow: 0 0 0 2px var(--glass-edge-strong);
  transform: scale(1.08);
}

.tb-avatar:active {
  transform: scale(0.94);
  transition-duration: var(--dur-1);
}

.tb-avatar img {
  display: block;
  width: 100%;
  height: 100%;
}

/* ---------------------------- 账号切换 / 新增面板 ---------------------------- */

.tb-users {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 228px;
  /* 账号少时也留出足够高度，新增卡片盖上去才放得下 */
  min-height: 150px;
  padding: 8px;
  border-radius: var(--r-card);
  animation: rise-account var(--dur-3) var(--spring-out) both;
}

/* 面板本体：新增弹框打开时整体虚化，把焦点让给上面那张卡片。
   用 opacity + scale 而不是 filter: blur——动画 filter 会触发逐帧重绘 */
.tb-users-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition:
    opacity var(--dur-3) var(--spring-settle),
    transform var(--dur-3) var(--spring-settle);
}

.tb-users.is-blurred .tb-users-body {
  opacity: 0.3;
  transform: scale(0.98);
  pointer-events: none;
  user-select: none;
}

.tb-users-title {
  margin: 2px 8px 6px;
  font-size: var(--fs-caption);
  color: var(--text-muted);
}

/* 每一行账号：可选中的名称区 + 右侧删除叉号 */
.tu-item {
  display: flex;
  align-items: center;
  gap: 2px;
  border: 1px solid transparent;
  border-radius: var(--r-control);
  transition:
    background-color var(--dur-2) var(--spring-settle),
    border-color var(--dur-2) var(--spring-settle);
}

.tu-item:hover {
  background: var(--glass-thin);
  border-color: var(--glass-edge);
}

.tu-item.on {
  background: color-mix(in srgb, var(--accent) 14%, var(--glass-base));
  border-color: color-mix(in srgb, var(--accent) 32%, var(--glass-edge));
}

.tu-pick {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 1 1 auto;
  min-width: 0;
  padding: 6px 4px 6px 8px;
  border: 0;
  border-radius: var(--r-control);
  background: transparent;
  color: var(--text);
  font-family: var(--body-font);
  font-size: var(--fs-label);
  text-align: start;
  cursor: pointer;
}

/* 删除叉号：安静地待在右侧，悬浮才亮成红色 */
.tu-del {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  margin-inline-end: 6px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0.5;
  transition:
    background-color var(--dur-2) var(--spring-settle),
    color var(--dur-2) var(--spring-settle),
    opacity var(--dur-2) var(--spring-settle);
}

.tu-del:hover {
  background: var(--danger);
  color: var(--on-danger);
  opacity: 1;
}

.tu-avatar {
  position: relative;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  overflow: hidden;
  border: 1px solid var(--glass-edge-strong);
  border-radius: 50%;
  background: var(--glass-solid);
  font-family: var(--display-font);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
}

.tu-avatar img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tu-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tu-role {
  margin-inline-start: auto;
  flex: 0 0 auto;
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

/* 新增账号：与账号行同款，但用强调色标出 */
.tu-add {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  margin-top: 3px;
  padding: 6px 8px;
  border: 1px solid transparent;
  border-radius: var(--r-control);
  background: transparent;
  color: var(--accent-deep);
  font-family: var(--body-font);
  font-size: var(--fs-label);
  font-weight: var(--fw-semi);
  text-align: start;
  cursor: pointer;
  transition:
    background-color var(--dur-2) var(--spring-settle),
    border-color var(--dur-2) var(--spring-settle);
}

.tu-add:hover {
  background: var(--glass-thin);
  border-color: var(--glass-edge);
}

.tu-add :deep(.v-icon) {
  opacity: 0.9;
}

/* -------------------------- 新增账号：卡片式浮层 -------------------------- */

/* 盖住账号面板 8 成区域的一张小卡片；背后面板自身模糊，焦点全交给它 */
.ud {
  position: absolute;
  inset: 10%;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
  padding: 12px;
  border: 1px solid var(--glass-edge-strong);
  border-radius: var(--r-card);
  background: var(--glass-solid);
  background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.55));
  box-shadow: var(--shadow-2);
  animation: ud-in var(--dur-3) var(--spring-jelly) both;
}

.ud-title {
  margin: 0;
  font-family: var(--display-font);
  font-size: var(--fs-body);
  font-weight: var(--fw-bold);
  color: var(--text);
}

.ud-input {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--glass-edge);
  border-radius: var(--r-control);
  background: var(--glass-thin);
  color: var(--text);
  font-family: var(--body-font);
  font-size: var(--fs-label);
  transition:
    box-shadow var(--dur-2) var(--spring-settle),
    background-color var(--dur-2) var(--spring-settle);
}

.ud-input::placeholder {
  color: var(--text-muted);
}

.ud-input:focus {
  outline: none;
  background: var(--glass-solid);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 22%, transparent);
}

.ud-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.ud-btn {
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--glass-edge);
  border-radius: var(--r-pill);
  background: var(--glass-thin);
  color: var(--text);
  font-family: var(--body-font);
  font-size: var(--fs-label);
  font-weight: var(--fw-medium);
  cursor: pointer;
  transition:
    background-color var(--dur-2) var(--spring-settle),
    box-shadow var(--dur-2) var(--spring-settle),
    opacity var(--dur-2) var(--spring-settle),
    transform var(--dur-2) var(--spring-jelly);
}

.ud-btn:hover {
  background: var(--glass-solid);
  box-shadow: var(--shadow-1);
}

.ud-btn:active {
  transform: scale(0.95);
  transition-duration: var(--dur-1);
}

.ud-btn.primary {
  border-color: transparent;
  background: var(--accent);
  color: var(--accent-contrast);
}

.ud-btn.primary:hover {
  background: var(--accent-deep);
}

.ud-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

@keyframes ud-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.udfade-enter-active,
.udfade-leave-active {
  transition: opacity var(--dur-3) var(--spring-settle);
}

.udfade-enter-from,
.udfade-leave-to {
  opacity: 0;
}

.tb-power {
  width: 38px;
  height: 38px;
  animation: rise-account var(--dur-4) var(--spring-out) 0.04s both;
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

/* 拖动中：只沿 X 轴跟手（--dx 由脚本给出），抬起放大一点浮起来 */
.tb-item.dragging {
  z-index: 2;
  cursor: grabbing;
  background: var(--glass-solid);
  border-color: var(--accent);
  transform: translateX(var(--dx, 0px)) scale(1.08);
  box-shadow: var(--shadow-2);
  transition: none;
}

/* 换位时按钮滑向新槽位，看起来就是"吸附拼接" */
.tb-move {
  transition: transform var(--dur-2) var(--spring-settle);
}

/* 点击应用：图标原地跳一下再落回 */
@keyframes tb-bounce {
  0% {
    transform: translateY(0) scale(1);
  }
  30% {
    transform: translateY(-9px) scale(1.14);
  }
  55% {
    transform: translateY(0) scale(0.95);
  }
  75% {
    transform: translateY(-3px) scale(1.05);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

.tb-item.bouncing {
  animation: tb-bounce var(--dur-5) var(--spring-jelly);
}

/* ------------------------------- 音乐律动 ------------------------------- */

.tb-eq {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  max-width: 148px;
  margin-inline-start: 4px;
  padding: 0 14px;
  border: 1px solid var(--glass-edge);
  border-radius: var(--r-pill);
  background: var(--glass-thin);
  color: var(--text);
  font-family: var(--body-font);
  cursor: pointer;
  transition:
    background-color var(--dur-2) var(--spring-settle),
    box-shadow var(--dur-2) var(--spring-settle),
    transform var(--dur-2) var(--spring-jelly);
}

.tb-eq:hover {
  background: var(--glass-solid);
  box-shadow: var(--shadow-1);
  transform: scale(1.04);
}

.tb-eq:active {
  transform: scale(0.95);
  transition-duration: var(--dur-1);
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
  animation: tb-eq 0.9s var(--ease-loop) infinite;
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
  font-size: var(--fs-caption);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
