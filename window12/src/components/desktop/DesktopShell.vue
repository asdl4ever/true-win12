<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useSpecular } from '../../composables/useSpecular'
import { useWindowDrag } from '../../composables/useWindowDrag'
import { games } from '../../data/games'
import { useDesktopStore } from '../../stores/desktop'
import Arcade from '../arcade/Arcade.vue'
import GlassWindow from '../common/GlassWindow.vue'
import PowerScreen from '../overlays/PowerScreen.vue'
import SearchPanel from '../overlays/SearchPanel.vue'
import TaskView from '../overlays/TaskView.vue'
import GameStore from '../store/GameStore.vue'
import ExplorerWindow from '../windows/ExplorerWindow.vue'
import MusicWindow from '../windows/MusicWindow.vue'
import SettingsWindow from '../windows/SettingsWindow.vue'
import DesktopIcons from './DesktopIcons.vue'
import DockRail from './DockRail.vue'
import SystemTray from './SystemTray.vue'
import TaskBar from './TaskBar.vue'

/**
 * 桌面外壳：壁纸光晕 + 图标栏 + 窗口舞台 + 任务栏 + 各种覆盖层。
 * 窗口内容（资源管理器 / 设置 / 小组件 / 商店 / 游戏）都是独立组件，
 * 拖拽、任务栏收起、时钟等交互也各自在 composables 里。
 */
const desktop = useDesktopStore()
const {
  panels,
  tokens,
  effects,
  specular,
  message: toastText,
  toasting: toast,
  power,
  taskViewOpen,
  searchOpen,
  activeGame,
} = storeToRefs(desktop)
const { dockPanel } = desktop

/* 液态玻璃的镜面反光：整个应用只挂一份监听 */
useSpecular(() => effects.value && specular.value)

/* 舞台元素用模板 ref 挂上，交给拖拽逻辑量可用区域 */
const stageEl = ref<HTMLElement | null>(null)
const { winBindings } = useWindowDrag(stageEl)

/* 游戏窗口的标题跟着正在玩的游戏走 */
const arcadeTitle = computed(() => {
  const game = games.find((item) => item.id === activeGame.value)
  return game ? `游戏 · ${game.name}` : '游戏'
})

/* 窗口开合的这段时间里，先把玻璃的 backdrop-filter 收起来：
   一张窗口在动，其余窗口都要逐帧重算背景模糊，这是多窗口时最大的卡顿来源。
   时长要盖住最长的开合过渡（退场 0.3s），否则动画没完就恢复模糊会看到一下跳变。 */
const WINDOW_ANIM_MS = 340
const windowsAnimating = ref(false)
let animTimer: number | undefined

watch(
  panels,
  () => {
    windowsAnimating.value = true
    window.clearTimeout(animTimer)
    animTimer = window.setTimeout(() => {
      windowsAnimating.value = false
    }, WINDOW_ANIM_MS)
  },
  { deep: true },
)

onBeforeUnmount(() => window.clearTimeout(animTimer))
</script>

<template>
  <v-app
    class="desktop"
    :class="{ ready: power === 'on' }"
    :data-effects="effects ? 'on' : 'off'"
    :style="tokens"
  >
    <div class="glow" aria-hidden="true"></div>

    <main class="desk" @click="desktop.selectedIcon = null">
      <DesktopIcons />

      <section ref="stageEl" class="stage" :class="{ animating: windowsAnimating }">
        <div class="win win-explorer" v-bind="winBindings('explorer')">
          <GlassWindow
            :open="panels.explorer"
            title="文件资源管理器"
            icon="mdi-folder-outline"
            @close="panels.explorer = false"
            @minimize="dockPanel('explorer')"
          >
            <ExplorerWindow />
          </GlassWindow>
        </div>

        <div class="win win-settings" v-bind="winBindings('settings')">
          <GlassWindow
            :open="panels.settings"
            title="设置 · 个性化"
            icon="mdi-cog-outline"
            @close="panels.settings = false"
            @minimize="dockPanel('settings')"
          >
            <SettingsWindow />
          </GlassWindow>
        </div>

        <div class="win win-music" v-bind="winBindings('music')">
          <GlassWindow
            :open="panels.music"
            title="音乐"
            icon="mdi-music"
            @close="panels.music = false"
            @minimize="dockPanel('music')"
          >
            <MusicWindow />
          </GlassWindow>
        </div>

        <div class="win win-store" v-bind="winBindings('store')">
          <GlassWindow
            :open="panels.store"
            class="glass-dense"
            title="应用商店"
            icon="mdi-storefront-outline"
            @close="panels.store = false"
            @minimize="dockPanel('store')"
          >
            <GameStore />
          </GlassWindow>
        </div>

        <div class="win win-arcade" v-bind="winBindings('arcade')">
          <GlassWindow
            :open="panels.arcade"
            class="glass-dense"
            :title="arcadeTitle"
            icon="mdi-gamepad-variant-outline"
            @close="panels.arcade = false"
            @minimize="dockPanel('arcade')"
          >
            <Arcade />
          </GlassWindow>
        </div>
      </section>
    </main>

    <DockRail />

    <SystemTray />

    <TaskBar />

    <transition name="tv">
      <TaskView v-if="taskViewOpen" />
    </transition>

    <!-- 搜索面板：屏幕中央、上边落在 30% 高度处 -->
    <transition name="search">
      <SearchPanel v-if="searchOpen" />
    </transition>

    <v-snackbar
      v-model="toast"
      class="toast"
      :timeout="1900"
      location="top right"
      color="rgba(61, 43, 14, 0.9)"
    >
      {{ toastText }}
    </v-snackbar>

    <PowerScreen />
  </v-app>
</template>

<style scoped>
/* --------------------------------- 壁纸光晕 -------------------------------- */

/* 空间环境光：一大团顶光 + 奶黄柔光 + 琥珀暖光，撑出 visionOS 的进深与空气感。
   整层只做 transform 位移的缓慢漂浮——它是合成层，不触发重绘。 */
.glow {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(60% 46% at 18% 4%, var(--ambient-white), transparent 68%),
    radial-gradient(52% 52% at 86% 82%, var(--ambient-gold), transparent 74%),
    radial-gradient(40% 40% at 72% 2%, var(--ambient-warm), transparent 72%),
    radial-gradient(38% 38% at 96% 30%, rgba(216, 169, 60, 0.18), transparent 72%);
  filter: blur(18px);
  transition: background 0.6s ease;
  animation: glow-drift 26s var(--ease-loop) infinite alternate;
}

@keyframes glow-drift {
  from {
    transform: translate3d(-2%, -1%, 0) scale(1);
  }
  to {
    transform: translate3d(2%, 2%, 0) scale(1.06);
  }
}

/* --------------------------------- 桌面布局 -------------------------------- */

.desk {
  position: relative;
  z-index: 5;
  display: flex;
  gap: 30px;
  height: 100dvh;
  /* 右侧多留一点，给常驻的右侧任务栏腾位置，窗口不会钻到它下面 */
  padding: 22px 74px 132px 30px;
}

/* ---------------------------------- 舞台 ---------------------------------- */

.stage {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
}

/* 有窗口在开合时，其余窗口也先摘掉背景模糊：一张窗口在动，
   兄弟窗口的背景每帧都要重新采样，是点 × 卡顿的主因 */
.stage.animating :deep(.glass-window) {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  background: var(--glass-solid);
  background-image: none;
}

/* ------------------------- 浮动卡片：依次浮现与 hover 放大 ------------------------ */

.win {
  position: absolute;
  z-index: 10;
  /* 入场延时由外层 .desktop.ready .win 统一给（animation 简写会覆盖这里的 animation-delay） */
  transition:
    left var(--dur-2) var(--spring-settle),
    top var(--dur-2) var(--spring-settle),
    scale var(--dur-3) var(--spring-jelly),
    translate var(--dur-3) var(--spring-jelly),
    visibility 0s linear 0s;
}

/* 收到右侧：向右缩小淡出，再把可见性关掉（组件保持挂载，游戏进度不丢）。
   淡出放在子卡片上——外层 .win 的入场动画锁住了它自己的 opacity，会盖掉这里的过渡 */
.win.docked {
  scale: 0.9;
  translate: 30px 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    scale var(--dur-3) var(--spring-jelly),
    translate var(--dur-3) var(--spring-jelly),
    visibility 0s linear var(--dur-3);
}

/* 只给「收到右侧」的窗口挂过渡：写成常驻规则会盖掉玻璃卡片自己的开合过渡
   （它的选择器优先级更高，会让关闭时的缩放变成瞬间跳变） */
.win.docked > .glass-window {
  opacity: 0;
  transition: opacity 0.2s ease;
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

.win-music {
  left: min(808px, 60vw);
  top: 40%;
  width: min(340px, 27vw);
  z-index: 11;
  --d: 0.34s;
}

/* 商店与游戏默认不开，位置留给它们展开时用 */
.win-store {
  left: min(300px, 20vw);
  top: 6%;
  width: min(620px, 44vw);
  z-index: 13;
  --d: 0.46s;
}

.win-arcade {
  left: min(360px, 26vw);
  top: 13%;
  width: min(430px, 34vw);
  z-index: 14;
  --d: 0.58s;
}

/* 拖动中的卡片：贴指针跟随，不做放大与阴影变化 */
.win.dragging {
  transition: none;
}

/* ------------------------------ 开机入场编排 ------------------------------ */

/* 桌面入场动画等开机画面退场后再播；图标与任务栏在各自组件里，用 :deep 穿透 */
/* 延后写在简写里：animation 简写会把 animation-delay 重置，子组件里的延时是无效的 */
.desktop.ready :deep(.desk-icons) {
  animation: jelly-rise var(--dur-5) var(--spring-out) 0.32s both;
}

.desktop.ready .win {
  animation: jelly-rise var(--dur-5) var(--spring-out) var(--d, 0s) both;
}

.desktop.ready :deep(.taskbar) {
  animation: rise-bar var(--dur-5) var(--spring-out) 0.4s both;
}

@keyframes rise-bar {
  from {
    opacity: 0;
    translate: 0 24px;
  }
  to {
    opacity: 1;
    translate: 0 0;
  }
}

/* --------------------------------- 窄屏回退 -------------------------------- */

@media (max-width: 1000px) {
  .desk {
    flex-direction: column;
    gap: 18px;
    height: auto;
    padding: 20px 18px 196px;
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
}
</style>
