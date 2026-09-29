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

/* 打开 / 关闭：淡入淡出 + 轻微缩放，关闭比打开快一点 */
.win-fade-enter-active {
  transition:
    opacity 0.22s ease,
    transform 0.26s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.win-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.18s cubic-bezier(0.4, 0, 1, 1);
}

.win-fade-enter-from,
.win-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
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
