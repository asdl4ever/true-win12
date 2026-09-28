<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  title: string
  icon: string
}>()

defineEmits<{ close: [] }>()

const minimized = ref(false)
</script>

<template>
  <div class="glass-window glass">
    <header class="win-bar">
      <v-icon :icon="icon" size="15" class="win-app" />
      <h2 class="win-title">{{ title }}</h2>
      <div class="win-actions">
        <button
          class="win-btn"
          type="button"
          :aria-label="minimized ? '展开窗口' : '最小化窗口'"
          @click="minimized = !minimized"
        >
          <v-icon :icon="minimized ? 'mdi-window-restore' : 'mdi-window-minimize'" size="12" />
        </button>
        <button class="win-btn close" type="button" aria-label="关闭窗口" @click="$emit('close')">
          <v-icon icon="mdi-close" size="13" />
        </button>
      </div>
    </header>
    <div v-show="!minimized" class="win-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.glass-window {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: var(--text);
}

.win-bar {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 8px 10px 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0));
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
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
  background: rgba(255, 255, 255, 0.18);
  opacity: 1;
}

.win-btn.close:hover {
  background: #e81123;
  color: #fff;
  opacity: 1;
}
</style>
