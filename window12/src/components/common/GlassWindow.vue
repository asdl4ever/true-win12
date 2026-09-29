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
  background: rgba(255, 253, 245, 0.66);
  background-image: none;
}

.win-fade-enter-active {
  transition:
    opacity 0.18s ease-out,
    transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.win-fade-leave-active {
  transition:
    opacity 0.24s ease-out,
    transform 0.3s cubic-bezier(0.32, 0.72, 0.3, 1);
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
  padding: 10px 8px 10px 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0));
  border-bottom: 1px solid var(--ink-line);
}

.win-app {
  opacity: 0.8;
}

.win-title {
  margin: 0;
  font-family: var(--display-font);
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.2px;
}

.win-actions {
  margin-inline-start: auto;
  display: flex;
  gap: 2px;
}

.win-btn {
  width: 30px;
  height: 26px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  opacity: 0.72;
  cursor: pointer;
  transition:
    background 0.2s ease,
    opacity 0.2s ease;
}

.win-btn:hover {
  background: rgba(255, 255, 255, 0.8);
  opacity: 1;
}

.win-btn.close:hover {
  background: #e81123;
  color: #fff;
  opacity: 1;
}
</style>
