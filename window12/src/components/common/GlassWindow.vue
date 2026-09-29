<script setup lang="ts">
/* 传入的 class（例如 glass-dense）要落到这张卡片上，交给 Transition 的根节点 */
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    open?: boolean
    title: string
    icon: string
  }>(),
  { open: true },
)

defineEmits<{ close: []; minimize: [] }>()
</script>

<template>
  <Transition name="win-fade">
    <div v-if="open" class="glass-window glass" v-bind="$attrs">
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
}

/* 打开 / 关闭动画只碰 opacity 与 transform（合成层内完成，不掉帧）。
   关键：动画期间摘掉 backdrop-filter —— 让浏览器对带背景模糊的元素逐帧重新采样
   是最贵的一步，也是之前点 × 卡顿的原因；这 0.2 秒用一层稍实的白顶住观感。 */
.win-fade-enter-active,
.win-fade-leave-active {
  will-change: opacity, transform;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  background: var(--glass-solid);
  background-image: none;
}

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
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 12px 12px 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0));
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
