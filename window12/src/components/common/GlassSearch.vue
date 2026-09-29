<script setup lang="ts">
import { nextTick, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    open: boolean
    placeholder?: string
  }>(),
  { placeholder: '搜索' },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:open': [value: boolean]
}>()

const field = ref<{ focus: () => void } | null>(null)

/* 点一下展开，并把焦点交给输入框 */
function openSearch() {
  if (props.open) return
  emit('update:open', true)
  nextTick(() => field.value?.focus())
}

function closeSearch() {
  emit('update:open', false)
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="glass-search">
    <v-text-field
      ref="field"
      :model-value="modelValue"
      class="glass-field"
      density="compact"
      hide-details
      variant="solo"
      flat
      bg-color="transparent"
      :placeholder="placeholder"
      prepend-inner-icon="mdi-magnify"
      @update:model-value="emit('update:modelValue', $event)"
      @focus="openSearch"
      @click="openSearch"
      @keydown.esc.stop="closeSearch"
    />

    <button
      v-if="open"
      class="glass-search-clear"
      type="button"
      aria-label="退出搜索"
      @click="closeSearch"
    >
      <v-icon icon="mdi-close" size="14" />
    </button>
  </div>
</template>

<style scoped>
/* 收起时窄条，展开由使用方决定宽度（行内用 flex-basis，竖排用 width） */
.glass-search {
  position: relative;
  max-width: 100%;
  transition:
    flex-basis var(--dur-4) var(--spring-jelly),
    width var(--dur-4) var(--spring-jelly);
}

.glass-search-clear {
  position: absolute;
  top: 50%;
  inset-inline-end: 8px;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: var(--ink-100);
  color: var(--text);
  cursor: pointer;
  transition:
    background-color var(--dur-2) var(--spring-settle),
    transform var(--dur-2) var(--spring-jelly);
}

.glass-search-clear:hover {
  background: var(--ink-300);
  transform: translateY(-50%) scale(1.1);
}
</style>
