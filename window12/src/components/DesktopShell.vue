<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import GlassWindow from './GlassWindow.vue'

type PanelId = 'explorer' | 'settings' | 'widget'

/* --------------------------------- 窗口状态 -------------------------------- */

const panels = ref<Record<PanelId, boolean>>({ explorer: true, settings: true, widget: true })

function togglePanel(id: PanelId) {
  panels.value[id] = !panels.value[id]
}

/* -------------------------------- 窗口拖拽 -------------------------------- */

const PANEL_LABEL: Record<PanelId, string> = {
  explorer: '文件资源管理器',
  settings: '设置 · 个性化',
  widget: '小组件',
}

const stageEl = ref<HTMLElement | null>(null)
/* null 表示还停在样式表给的初始位置 */
const positions = ref<Record<PanelId, { x: number; y: number } | null>>({
  explorer: null,
  settings: null,
  widget: null,
})
const zIndexes = ref<Record<PanelId, number>>({ explorer: 10, settings: 12, widget: 11 })
const dragging = ref<PanelId | null>(null)
let topZ = 13

type DragState = {
  panel: PanelId
  pointerX: number
  pointerY: number
  originX: number
  originY: number
  el: HTMLElement
}
let dragState: DragState | null = null

function raise(panel: PanelId) {
  zIndexes.value[panel] = ++topZ
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/* 约束在桌面范围内，避免卡片被拖出视野或压住任务栏 */
function placeWindow(panel: PanelId, x: number, y: number, el?: HTMLElement) {
  const stage = stageEl.value
  const maxX = Math.max(0, (stage?.clientWidth ?? 0) - (el?.offsetWidth ?? 0))
  const maxY = Math.max(0, (stage?.clientHeight ?? 0) - (el?.offsetHeight ?? 0))
  positions.value[panel] = { x: clamp(x, 0, maxX), y: clamp(y, 0, maxY) }
}

function startDrag(panel: PanelId, event: PointerEvent) {
  const target = event.target as HTMLElement
  if (event.button !== 0 || target.closest('button') || !target.closest('.win-bar')) return
  if (window.matchMedia('(max-width: 1000px)').matches) return

  const el = event.currentTarget as HTMLElement
  const from = positions.value[panel] ?? { x: el.offsetLeft, y: el.offsetTop }
  positions.value[panel] = from
  dragState = {
    panel,
    pointerX: event.clientX,
    pointerY: event.clientY,
    originX: from.x,
    originY: from.y,
    el,
  }
  dragging.value = panel
  raise(panel)
  el.setPointerCapture(event.pointerId)
  event.preventDefault()
}

function moveDrag(event: PointerEvent) {
  if (!dragState) return
  placeWindow(
    dragState.panel,
    dragState.originX + event.clientX - dragState.pointerX,
    dragState.originY + event.clientY - dragState.pointerY,
    dragState.el,
  )
}

function endDrag(event: PointerEvent) {
  if (!dragState) return
  if (dragState.el.hasPointerCapture(event.pointerId)) {
    dragState.el.releasePointerCapture(event.pointerId)
  }
  dragState = null
  dragging.value = null
}

function moveWindow(panel: PanelId, event: KeyboardEvent) {
  const step = event.shiftKey ? 64 : 24
  const steps: Record<string, [number, number] | undefined> = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: [0, -step],
    ArrowDown: [0, step],
  }
  const delta = steps[event.key]
  if (!delta) return

  const el = event.currentTarget as HTMLElement
  const from = positions.value[panel] ?? { x: el.offsetLeft, y: el.offsetTop }
  placeWindow(panel, from.x + delta[0], from.y + delta[1], el)
  raise(panel)
  event.preventDefault()
}

function winBindings(panel: PanelId) {
  const pos = positions.value[panel]
  return {
    class: { dragging: dragging.value === panel },
    style: {
      left: pos ? `${pos.x}px` : undefined,
      top: pos ? `${pos.y}px` : undefined,
      zIndex: zIndexes.value[panel],
    },
    tabindex: 0,
    role: 'group',
    'aria-label': `窗口 ${PANEL_LABEL[panel]}：拖动标题栏或按方向键移动，按住 Shift 加速`,
    onPointerdown: (event: PointerEvent) => startDrag(panel, event),
    onPointermove: moveDrag,
    onPointerup: endDrag,
    onPointercancel: endDrag,
    onKeydown: (event: KeyboardEvent) => moveWindow(panel, event),
  }
}

/* ---------------------------------- 反馈 ---------------------------------- */

const toast = ref(false)
const toastText = ref('')

function notify(text: string) {
  toastText.value = text
  toast.value = true
}

/* ---------------------------------- 时钟 ---------------------------------- */

const now = ref(new Date())
let clockTimer: number | undefined

const time = computed(() =>
  now.value.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
)
const seconds = computed(() => now.value.getSeconds().toString().padStart(2, '0'))
const date = computed(() =>
  now.value.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }),
)
const shortDate = computed(() =>
  now.value.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }),
)

onMounted(() => {
  clockTimer = window.setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onBeforeUnmount(() => {
  window.clearInterval(clockTimer)
  window.clearInterval(mediaTimer)
})

/* ------------------------------ 外观实时参数 ------------------------------ */

const accent = ref('#a78bfa')
const accents = [
  { name: '紫罗兰', value: '#a78bfa' },
  { name: '海蓝', value: '#7cc2ff' },
  { name: '薄荷', value: '#6ee7b7' },
  { name: '落霞', value: '#fda4af' },
]
const blur = ref(24)
const radius = ref(20)
const effects = ref(true)

const tokens = computed(() => ({
  '--accent': accent.value,
  '--blur': `${effects.value ? blur.value : 0}px`,
  '--radius': `${radius.value}px`,
}))

/* -------------------------------- 桌面图标 -------------------------------- */

const desktopIcons = [
  { id: 'pc', label: '此电脑', icon: 'mdi-monitor', panel: 'explorer' as PanelId | null },
  { id: 'projects', label: '项目', icon: 'mdi-folder-outline', panel: 'explorer' as PanelId | null },
  { id: 'terminal', label: '终端', icon: 'mdi-console', panel: null },
  { id: 'trash', label: '回收站', icon: 'mdi-trash-can-outline', panel: null },
  { id: 'settings', label: '设置', icon: 'mdi-cog-outline', panel: 'settings' as PanelId | null },
]
const selected = ref<string | null>(null)

function openIcon(icon: (typeof desktopIcons)[number]) {
  if (icon.panel) {
    panels.value[icon.panel] = true
    return
  }
  notify(`${icon.label} 暂时打不开`)
}

/* ------------------------------ 文件资源管理器 ------------------------------ */

const places = [
  { label: '主页', icon: 'mdi-home-outline' },
  { label: '桌面', icon: 'mdi-monitor-dashboard' },
  { label: '下载', icon: 'mdi-download-outline' },
  { label: '文档', icon: 'mdi-file-document-outline' },
  { label: '图片', icon: 'mdi-image-multiple-outline' },
  { label: '音乐', icon: 'mdi-music-note-outline' },
]
const place = ref('主页')
const query = ref('')
const pickedFile = ref<string | null>(null)

const files = [
  { name: '季度汇报.pptx', meta: '演示文稿 · 4.2 MB', icon: 'mdi-file-powerpoint-outline' },
  { name: '品牌规范.fig', meta: '设计文件 · 18.6 MB', icon: 'mdi-vector-polygon' },
  { name: '首页原型.png', meta: '图片 · 2.1 MB', icon: 'mdi-image-outline' },
  { name: '会议记录.docx', meta: '文档 · 128 KB', icon: 'mdi-file-document-outline' },
  { name: '预算表.xlsx', meta: '表格 · 76 KB', icon: 'mdi-table-large' },
  { name: '落地页文案.md', meta: '文本 · 8 KB', icon: 'mdi-language-markdown-outline' },
]
const visibleFiles = computed(() => files.filter((file) => file.name.includes(query.value.trim())))

/* -------------------------------- 正在播放 -------------------------------- */

const playing = ref(false)
const progress = ref(38)
let mediaTimer: number | undefined

function togglePlay() {
  playing.value = !playing.value
  if (playing.value) {
    mediaTimer = window.setInterval(() => {
      progress.value = progress.value >= 100 ? 0 : progress.value + 1
    }, 900)
  } else {
    window.clearInterval(mediaTimer)
  }
}

const agenda = [
  { time: '14:30', title: '设计走查 · 与产品同步玻璃层级' },
  { time: '17:00', title: '提交桌面版高保真稿' },
]

/* -------------------------------- 开始菜单 -------------------------------- */

const startOpen = ref(false)
const startQuery = ref('')

const pinned = [
  { label: '文件资源管理器', icon: 'mdi-folder-outline', panel: 'explorer' as PanelId | null },
  { label: '设置', icon: 'mdi-cog-outline', panel: 'settings' as PanelId | null },
  { label: '小组件', icon: 'mdi-view-dashboard-outline', panel: 'widget' as PanelId | null },
  { label: '终端', icon: 'mdi-console', panel: null },
  { label: '音乐', icon: 'mdi-music', panel: null },
  { label: '照片', icon: 'mdi-image-outline', panel: null },
]
const filteredPinned = computed(() =>
  pinned.filter((app) => app.label.includes(startQuery.value.trim())),
)

function openApp(app: (typeof pinned)[number]) {
  startOpen.value = false
  startQuery.value = ''
  if (app.panel) {
    panels.value[app.panel] = true
    return
  }
  notify(`${app.label} 正在开发中`)
}
</script>

<template>
  <v-app class="desktop" :style="tokens">
    <div class="glow" aria-hidden="true"></div>

    <main class="desk" @click="selected = null">
      <aside class="desk-icons">
        <button
          v-for="icon in desktopIcons"
          :key="icon.id"
          class="desk-icon"
          :class="{ selected: selected === icon.id }"
          type="button"
          @click.stop="selected = icon.id"
          @dblclick="openIcon(icon)"
        >
          <v-icon :icon="icon.icon" size="27" />
          <span>{{ icon.label }}</span>
        </button>
      </aside>

      <section ref="stageEl" class="stage">
        <div class="win win-explorer" v-bind="winBindings('explorer')">
          <GlassWindow
            v-if="panels.explorer"
            title="文件资源管理器"
            icon="mdi-folder-outline"
            @close="panels.explorer = false"
          >
            <div class="explorer">
              <nav class="ex-side">
                <button
                  v-for="item in places"
                  :key="item.label"
                  class="ex-place"
                  :class="{ on: place === item.label }"
                  type="button"
                  @click="place = item.label"
                >
                  <v-icon :icon="item.icon" size="16" />
                  <span>{{ item.label }}</span>
                </button>
              </nav>

              <div class="ex-main">
                <div class="ex-tools">
                  <v-btn
                    icon="mdi-plus"
                    variant="text"
                    size="small"
                    aria-label="新建"
                    @click="notify('这里会新建一个文件')"
                  />
                  <v-text-field
                    v-model="query"
                    class="glass-field"
                    density="compact"
                    hide-details
                    variant="solo"
                    flat
                    bg-color="rgba(255, 255, 255, 0.12)"
                    placeholder="搜索文件与文件夹"
                    prepend-inner-icon="mdi-magnify"
                  />
                </div>

                <div class="ex-grid">
                  <button
                    v-for="file in visibleFiles"
                    :key="file.name"
                    class="file"
                    :class="{ on: pickedFile === file.name }"
                    type="button"
                    @click="pickedFile = file.name"
                    @dblclick="notify(`正在用默认应用打开 ${file.name}`)"
                  >
                    <v-icon :icon="file.icon" size="21" />
                    <span class="file-name">{{ file.name }}</span>
                    <span class="file-meta">{{ file.meta }}</span>
                  </button>
                  <p v-if="!visibleFiles.length" class="empty">没有匹配「{{ query }}」的文件</p>
                </div>
              </div>
            </div>
          </GlassWindow>
        </div>

        <div class="win win-settings" v-bind="winBindings('settings')">
          <GlassWindow
            v-if="panels.settings"
            title="设置 · 个性化"
            icon="mdi-cog-outline"
            @close="panels.settings = false"
          >
            <div class="settings">
              <p class="set-note">调整外观，桌面上的玻璃卡片会立刻跟着变。</p>

              <div class="set-row">
                <span class="set-label">主题色</span>
                <div class="swatches">
                  <button
                    v-for="item in accents"
                    :key="item.value"
                    class="swatch"
                    :class="{ on: accent === item.value }"
                    :style="{ '--sw': item.value }"
                    type="button"
                    :aria-label="item.name"
                    :aria-pressed="accent === item.value"
                    @click="accent = item.value"
                  />
                </div>
              </div>

              <div class="set-row">
                <span class="set-label">背景模糊</span>
                <span class="set-value">{{ effects ? blur : 0 }}px</span>
              </div>
              <v-slider
                v-model="blur"
                :min="8"
                :max="40"
                :step="2"
                :disabled="!effects"
                hide-details
                density="compact"
                color="#ffffff"
                track-color="rgba(255, 255, 255, 0.28)"
                track-fill-color="rgba(255, 255, 255, 0.85)"
              />

              <div class="set-row">
                <span class="set-label">卡片圆角</span>
                <span class="set-value">{{ radius }}px</span>
              </div>
              <v-slider
                v-model="radius"
                :min="0"
                :max="32"
                :step="2"
                hide-details
                density="compact"
                color="#ffffff"
                track-color="rgba(255, 255, 255, 0.28)"
                track-fill-color="rgba(255, 255, 255, 0.85)"
              />

              <v-switch
                v-model="effects"
                class="glass-switch"
                label="透明与模糊效果"
                hide-details
                density="compact"
                color="#ffffff"
              />
            </div>
          </GlassWindow>
        </div>

        <div class="win win-widget" v-bind="winBindings('widget')">
          <GlassWindow
            v-if="panels.widget"
            title="小组件"
            icon="mdi-view-dashboard-outline"
            @close="panels.widget = false"
          >
            <div class="widget">
              <p class="clock">
                <span class="clock-time">{{ time }}</span>
                <span class="clock-sec">{{ seconds }}</span>
              </p>
              <p class="clock-date">{{ date }}</p>

              <div class="wx">
                <v-icon icon="mdi-weather-partly-cloudy" size="26" />
                <div>
                  <strong>26° 多云</strong>
                  <span>空气优 · 微风 · 湿度 58%</span>
                </div>
              </div>

              <div class="player">
                <div class="player-head">
                  <v-icon icon="mdi-music" size="17" />
                  <span class="player-title">Weightless</span>
                  <span class="player-artist">Marconi Union</span>
                </div>
                <v-progress-linear
                  :model-value="progress"
                  height="4"
                  rounded
                  color="#ffffff"
                  bg-color="rgba(255, 255, 255, 0.25)"
                />
                <div class="player-actions">
                  <v-btn icon="mdi-skip-backward" variant="text" size="small" aria-label="上一首" />
                  <v-btn
                    class="player-play"
                    :icon="playing ? 'mdi-pause' : 'mdi-play'"
                    size="small"
                    variant="flat"
                    :aria-label="playing ? '暂停' : '播放'"
                    @click="togglePlay"
                  />
                  <v-btn icon="mdi-skip-forward" variant="text" size="small" aria-label="下一首" />
                </div>
              </div>

              <ul class="agenda">
                <li v-for="item in agenda" :key="item.time">
                  <span class="agenda-time">{{ item.time }}</span>
                  <span>{{ item.title }}</span>
                </li>
              </ul>
            </div>
          </GlassWindow>
        </div>
      </section>
    </main>

    <footer class="taskbar glass glass-dense" @click="startOpen = false">
      <button
        class="tb-btn tb-start"
        type="button"
        aria-label="开始"
        :aria-expanded="startOpen"
        @click.stop="startOpen = !startOpen"
      >
        <v-icon icon="mdi-microsoft-windows" size="20" />
      </button>
      <button class="tb-search" type="button" @click="notify('搜索会在下个版本接入')">
        <v-icon icon="mdi-magnify" size="15" />
        <span>搜索</span>
      </button>
      <button class="tb-btn" type="button" aria-label="任务视图" @click="notify('任务视图正在开发中')">
        <v-icon icon="mdi-view-dashboard-outline" size="20" />
      </button>
      <button
        class="tb-btn"
        :class="{ running: panels.explorer }"
        type="button"
        aria-label="文件资源管理器"
        @click="togglePanel('explorer')"
      >
        <v-icon icon="mdi-folder-outline" size="20" />
      </button>
      <button class="tb-btn" type="button" aria-label="终端" @click="notify('终端正在开发中')">
        <v-icon icon="mdi-console" size="20" />
      </button>
      <button
        class="tb-btn"
        :class="{ running: panels.settings }"
        type="button"
        aria-label="设置"
        @click="togglePanel('settings')"
      >
        <v-icon icon="mdi-cog-outline" size="20" />
      </button>

      <div class="tb-tray">
        <v-icon icon="mdi-wifi" size="15" />
        <v-icon icon="mdi-volume-high" size="15" />
        <v-icon icon="mdi-battery-80" size="15" />
        <span class="tb-clock">
          {{ time }}
          <em>{{ shortDate }}</em>
        </span>
        <button class="tb-btn tb-bell" type="button" aria-label="通知" @click="notify('没有新的通知')">
          <v-icon icon="mdi-bell-outline" size="18" />
        </button>
      </div>
    </footer>

    <div v-if="startOpen" class="scrim" @click="startOpen = false"></div>

    <transition name="menu">
      <section v-if="startOpen" class="start glass glass-dense" aria-label="开始菜单">
        <v-text-field
          v-model="startQuery"
          class="glass-field"
          density="comfortable"
          hide-details
          variant="solo"
          flat
          bg-color="rgba(255, 255, 255, 0.12)"
          placeholder="搜索应用、文件与设置"
          prepend-inner-icon="mdi-magnify"
        />

        <p class="start-heading">已固定</p>
        <div class="tiles">
          <button
            v-for="app in filteredPinned"
            :key="app.label"
            class="tile"
            type="button"
            @click="openApp(app)"
          >
            <v-icon :icon="app.icon" size="23" />
            <span>{{ app.label }}</span>
          </button>
          <p v-if="!filteredPinned.length" class="empty">没有找到匹配的应用</p>
        </div>

        <p class="start-heading">最近</p>
        <ul class="recent">
          <li v-for="file in files.slice(0, 3)" :key="file.name">
            <v-icon :icon="file.icon" size="17" />
            <span class="recent-name">{{ file.name }}</span>
            <span class="recent-meta">{{ file.meta }}</span>
          </li>
        </ul>

        <div class="start-foot">
          <span class="avatar">陈</span>
          <span class="who">陈默</span>
          <v-btn
            icon="mdi-power"
            variant="text"
            size="small"
            aria-label="关机"
            @click="notify('锁定屏幕需要管理员权限')"
          />
        </div>
      </section>
    </transition>

    <v-snackbar v-model="toast" :timeout="1900" location="bottom" color="rgba(30, 18, 62, 0.9)">
      {{ toastText }}
    </v-snackbar>
  </v-app>
</template>

<style scoped>
/* --------------------------------- 壁纸光晕 -------------------------------- */

.glow {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(58% 48% at 16% 10%, rgba(255, 255, 255, 0.26), transparent 70%),
    radial-gradient(
      42% 44% at 90% 80%,
      color-mix(in srgb, var(--accent) 70%, transparent),
      transparent 72%
    ),
    radial-gradient(34% 34% at 74% 6%, rgba(124, 194, 255, 0.26), transparent 70%);
  filter: blur(4px);
  transition: background 0.6s ease;
}

/* --------------------------------- 桌面布局 -------------------------------- */

.desk {
  position: relative;
  z-index: 5;
  display: flex;
  gap: 30px;
  height: 100dvh;
  padding: 22px 30px 132px;
}

.desk-icons {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 88px;
  animation: rise 0.85s cubic-bezier(0.16, 0.84, 0.28, 1) both;
  animation-delay: 0.44s;
}

.desk-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 4px 8px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  font-family: var(--body-font);
  font-size: 11px;
  line-height: 1.2;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.desk-icon:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.18);
}

.desk-icon.selected {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.32);
}

.stage {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
}

/* ------------------------- 浮动卡片：依次浮现与 hover 放大 ------------------------ */

.win {
  position: absolute;
  z-index: 10;
  animation: rise 0.9s cubic-bezier(0.16, 0.84, 0.28, 1) both;
  animation-delay: var(--d, 0s);
  transition:
    left 0.18s ease,
    top 0.18s ease;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(26px) scale(0.965);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.win > .glass-window {
  transition:
    transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.45s ease;
}

@media (min-width: 1001px) and (hover: hover) {
  .win:hover > .glass-window {
    transform: scale(1.05);
    box-shadow:
      0 32px 72px rgba(24, 12, 58, 0.46),
      inset 0 1px 0 rgba(255, 255, 255, 0.28);
  }
}

/* 三张卡片斜向叠压：只让边缘互相压住，避免遮住正文 */
.win-explorer {
  left: 0;
  top: 3%;
  width: min(520px, 40vw);
  --d: 0.06s;
}

.win-settings {
  left: min(492px, 37vw);
  top: 10%;
  width: min(340px, 27vw);
  z-index: 12;
  --d: 0.2s;
}

.win-widget {
  left: min(808px, 60vw);
  top: 44%;
  width: min(300px, 25vw);
  z-index: 11;
  --d: 0.34s;
}

/* 拖动中的卡片：贴着指针跟随，同时保持"被抬起"的观感 */
.win.dragging {
  transition: none;
}

.win.dragging > .glass-window {
  transition: none;
  transform: scale(1.02);
  box-shadow:
    0 34px 74px rgba(24, 12, 58, 0.48),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

/* ------------------------------ 资源管理器内部 ----------------------------- */

.explorer {
  display: flex;
  height: min(400px, 50dvh);
}

.ex-side {
  flex: 0 0 118px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 8px;
  border-inline-end: 1px solid rgba(255, 255, 255, 0.12);
}

.ex-place {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: rgba(255, 255, 255, 0.78);
  font-family: var(--body-font);
  font-size: 12.5px;
  text-align: start;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.ex-place:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.ex-place.on {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}

.ex-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.ex-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
}

.ex-tools :deep(.v-btn) {
  color: rgba(255, 255, 255, 0.85);
}

.glass-field :deep(.v-field) {
  border-radius: 12px;
  font-size: 13px;
}

.glass-field :deep(.v-field__prepend-inner .v-icon) {
  color: rgba(255, 255, 255, 0.7);
  opacity: 1;
}

.glass-field :deep(.v-field__input) {
  color: #fff;
  font-size: 13px;
  min-height: 34px;
  padding-top: 4px;
  padding-bottom: 4px;
}

.glass-field :deep(input::placeholder) {
  color: rgba(255, 255, 255, 0.55);
  opacity: 1;
}

.ex-grid {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: 6px;
  padding: 4px 12px 14px;
}

.file {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 12px 12px 11px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-family: var(--body-font);
  text-align: start;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.file:hover {
  background: rgba(255, 255, 255, 0.13);
}

.file.on {
  background: color-mix(in srgb, var(--accent) 28%, transparent);
  border-color: rgba(255, 255, 255, 0.32);
}

.file-name {
  font-size: 12.5px;
  font-weight: 500;
  word-break: break-all;
}

.file-meta {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.empty {
  grid-column: 1 / -1;
  margin: 12px 2px;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.62);
}

/* --------------------------------- 设置内部 -------------------------------- */

.settings {
  padding: 16px 18px 18px;
}

.set-note {
  margin: 0 0 14px;
  font-size: 12.5px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.72);
}

.set-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}

.set-label {
  font-size: 12.5px;
  font-weight: 500;
}

.set-value {
  font-family: var(--display-font);
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.72);
}

.swatches {
  display: flex;
  gap: 7px;
}

.swatch {
  width: 21px;
  height: 21px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 50%;
  background: var(--sw);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.swatch:hover {
  transform: scale(1.12);
}

.swatch.on {
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.32);
}

.settings :deep(.v-slider) {
  margin-top: 4px;
}

.glass-switch :deep(.v-label) {
  color: rgba(255, 255, 255, 0.88);
  font-size: 12.5px;
  opacity: 1;
}

.glass-switch :deep(.v-switch__track) {
  opacity: 0.4;
}

/* -------------------------------- 小组件内部 ------------------------------- */

.widget {
  padding: 16px 18px 18px;
}

.clock {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin: 0;
}

.clock-time {
  font-family: var(--display-font);
  font-weight: 700;
  font-size: 38px;
  line-height: 1;
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
}

.clock-sec {
  font-family: var(--display-font);
  font-weight: 600;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.68);
  font-variant-numeric: tabular-nums;
}

.clock-date {
  margin: 6px 0 14px;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.72);
}

.wx {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 13px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.07);
}

.wx strong {
  display: block;
  font-size: 13px;
  font-weight: 600;
}

.wx span {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.66);
}

.player {
  margin-top: 12px;
  padding: 12px 13px 10px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.07);
}

.player-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 9px;
}

.player-title {
  font-size: 12.5px;
  font-weight: 600;
}

.player-artist {
  margin-inline-start: auto;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.player-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
}

.player-actions :deep(.v-btn) {
  color: rgba(255, 255, 255, 0.88);
}

.player-play {
  background: var(--accent);
  color: #241348;
}

.agenda {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.agenda li {
  display: flex;
  gap: 10px;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.82);
}

.agenda-time {
  font-family: var(--display-font);
  font-weight: 600;
  color: var(--accent);
}

/* ---------------------------------- 任务栏 --------------------------------- */

.taskbar {
  position: fixed;
  left: 50%;
  bottom: 18px;
  z-index: 80;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 7px 10px;
  border-radius: var(--radius);
  animation: rise-bar 0.85s cubic-bezier(0.16, 0.84, 0.28, 1) both;
  animation-delay: 0.52s;
}

@keyframes rise-bar {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%);
  }
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
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.tb-btn:hover {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.18);
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
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.82);
  font-family: var(--body-font);
  font-size: 12.5px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.tb-search:hover {
  background: rgba(255, 255, 255, 0.18);
}

.tb-tray {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-inline-start: 8px;
  padding-inline-start: 14px;
  border-inline-start: 1px solid rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.85);
}

.tb-clock {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.25;
  font-family: var(--display-font);
  font-weight: 600;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.tb-clock em {
  font-family: var(--body-font);
  font-style: normal;
  font-weight: 400;
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.66);
}

.tb-bell {
  width: 34px;
  height: 34px;
}

/* --------------------------------- 开始菜单 -------------------------------- */

.scrim {
  position: fixed;
  inset: 0;
  z-index: 70;
}

.start {
  position: fixed;
  left: 50%;
  bottom: 92px;
  z-index: 90;
  width: min(540px, 92vw);
  padding: 20px;
  transform: translateX(-50%);
}

.menu-enter-active,
.menu-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(16px) scale(0.98);
}

.start-heading {
  margin: 16px 2px 9px;
  font-size: 11.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}

.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 6px;
}

.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 13px 6px 11px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-family: var(--body-font);
  font-size: 11.5px;
  line-height: 1.3;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.tile:hover {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.2);
}

.recent {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 4px;
}

.recent li {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 10px;
  border-radius: 12px;
  font-size: 12px;
  transition: background 0.2s ease;
}

.recent li:hover {
  background: rgba(255, 255, 255, 0.12);
}

.recent-name {
  font-weight: 500;
}

.recent-meta {
  margin-inline-start: auto;
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.58);
}

.start-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.16);
}

.avatar {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--accent);
  color: #241348;
  font-family: var(--display-font);
  font-weight: 700;
  font-size: 13px;
}

.who {
  font-size: 12.5px;
  font-weight: 500;
}

.start-foot :deep(.v-btn) {
  margin-inline-start: auto;
  color: rgba(255, 255, 255, 0.85);
}

/* --------------------------------- 窄屏回退 -------------------------------- */

@media (max-width: 1000px) {
  .desk {
    flex-direction: column;
    gap: 18px;
    height: auto;
    padding: 20px 18px 196px;
  }

  .desk-icons {
    flex-direction: row;
    flex-wrap: wrap;
    width: 100%;
  }

  .stage {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .win {
    position: static;
    width: 100%;
  }

  .explorer {
    height: auto;
  }

  .ex-grid {
    max-height: 260px;
  }

  .tb-search span,
  .tb-clock em {
    display: none;
  }

  .tb-tray :deep(.v-icon) {
    display: none;
  }
}

@media (max-width: 640px) {
  .ex-side {
    display: none;
  }

  .tb-search {
    padding: 0 12px;
  }

  .clock-time {
    font-size: 32px;
  }
}
</style>
