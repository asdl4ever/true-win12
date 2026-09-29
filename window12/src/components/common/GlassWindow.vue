<script setup lang="ts">
/* 传入的 class（例如 glass-dense）要落到这张卡片上，交给 Transition 的根节点 */
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    open?: boolean
    title: string
    icon: string
    /** 是否是最上层（正在响应用户的）窗口 */
    active?: boolean
  }>(),
  { open: true, active: false },
)

defineEmits<{ close: []; minimize: [] }>()
</script>

<template>
  <Transition name="win-fade">
    <div
      v-if="open"
      class="glass-window glass"
      :class="{ 'is-front': active }"
      :aria-current="active ? 'true' : undefined"
      v-bind="$attrs"
    >
      <header class="win-bar">
        <v-icon :icon="icon" size="15" class="win-app" />
        <h2 class="win-title">{{ title }}</h2>
        <div class="win-actions">
          <button
            class="win-btn"
            type="button"
            title="收到桌面右侧"
            aria-label="收到桌面右侧"
            @click="$emit('minimize')"
          >
            <v-icon icon="mdi-window-minimize" size="12" />
          </button>
          <button class="win-btn close" type="button" aria-label="关闭窗口" @click="$emit('close')">
            <v-icon icon="mdi-close" size="13" />
          </button>
        </div>
      </header>
      <div class="win-body">
        <slot />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.glass-window {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: var(--text);
  transition: border-color var(--dur-3) var(--spring-settle);
}

/* ------------------------- 活动窗口 / 后台窗口 ------------------------- */
/* 后台：投影收一档、边更虚、标题栏压到 60%，内容本体不动（仍可正常阅读与点击）。
   只过渡 border-color 与 opacity——box-shadow / filter 的过渡会触发逐帧重绘，不碰。
   注意不改 --m-bg：M2 窗口与 M3 窗口的底色不同，统一覆盖会把商店/游戏窗口拉回 M2。 */

.glass-window.is-front {
  --m-edge: var(--glass-edge-strong);
  --m-shadow: var(--shadow-3);
}

.glass-window:not(.is-front) {
  --m-edge: color-mix(in srgb, var(--glass-edge) 48%, transparent);
  --m-shadow: var(--shadow-1);
}

/* 只压标题栏（图标、标题、关闭钮都在里面），不逐个元素叠加，
   否则两层透明度相乘会把关闭按钮压到几乎看不见 */
.glass-window:not(.is-front) .win-bar {
  opacity: 0.6;
}

/* 前景窗口在标题栏左侧点一颗强调色小点——键盘切窗口时也需要一个瞬时可见的落点。
   绝对定位在左侧内边距里，不参与布局，避免标题位移。 */
.win-bar::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 50%;
  width: 5px;
  height: 5px;
  margin-top: -2.5px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 6px color-mix(in srgb, var(--accent) 70%, transparent);
  opacity: 0;
  transform: scale(0.4);
  transition:
    opacity var(--dur-3) var(--spring-settle),
    transform var(--dur-2) var(--spring-jelly);
}

.glass-window.is-front .win-bar::before {
  opacity: 1;
  transform: none;
}

/* 开合动画只碰 opacity 与 transform（合成层内完成，不掉帧）。
   这里**不摘 backdrop-filter**：正在动的那张窗口背后是静态壁纸与静止的兄弟窗口，
   滤镜结果可以复用；摘掉它会让新窗口先"实"一下再变玻璃，能明显看到一跳。
   真正需要摘模糊的是它下层的兄弟窗口，那在 DesktopShell 的 .stage.animating 里处理。

   也不要加 will-change: transform —— Chrome 里它和 backdrop-filter 同时存在时
   会把背景模糊整个关掉。元素已经因为 backdrop-filter 被提升为合成层，本来也不需要这个提示。 */
.win-fade-enter-active {
  transition:
    opacity var(--dur-2) var(--spring-out),
    transform var(--dur-3) var(--spring-jelly);
}

.win-fade-leave-active {
  transition:
    opacity var(--dur-2) var(--spring-out),
    transform var(--dur-3) var(--spring-settle);
  /* 阴影不单独改：跟随整体透明度一起淡出（瞬时改阴影会看到一下跳变） */
  pointer-events: none;
}

.win-fade-enter-from {
  opacity: 0;
  transform: translate3d(0, 10px, 0) scale(0.96);
}

.win-fade-leave-to {
  opacity: 0;
  transform: translate3d(0, 14px, 0) scale(0.94);
}

.win-body {
  min-height: 0;
}

.win-bar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 12px 12px 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0));
  transition: opacity var(--dur-3) var(--spring-settle);
}

.win-app {
  opacity: 0.7;
}

.win-title {
  margin: 0;
  font-family: var(--display-font);
  font-weight: var(--fw-semi);
  font-size: var(--fs-title);
  letter-spacing: -0.01em;
}

.win-actions {
  margin-inline-start: auto;
  display: flex;
  gap: 6px;
}

/* 液态玻璃的圆形控件：静默时只有一个淡淡的高光边，悬浮才显形 */
.win-btn {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: 1px solid var(--glass-edge);
  border-radius: 50%;
  background: var(--glass-thin);
  color: inherit;
  opacity: 0.72;
  cursor: pointer;
  transition:
    background-color var(--dur-2) var(--spring-settle),
    box-shadow var(--dur-2) var(--spring-settle),
    opacity var(--dur-2) var(--spring-settle),
    transform var(--dur-2) var(--spring-jelly);
}

.win-btn:hover {
  background: var(--glass-solid);
  box-shadow: var(--shadow-1);
  opacity: 1;
  transform: scale(1.06);
}

.win-btn:active {
  transform: scale(0.92);
  transition-duration: var(--dur-1);
}

.win-btn.close:hover {
  background: var(--danger);
  border-color: var(--danger);
  color: var(--on-danger);
  opacity: 1;
}
</style>
