<script setup lang="ts">
import { computed, ref } from 'vue'
import { files, places } from '../../data/explorer'
import { useDesktopStore } from '../../stores/desktop'

/* 文件资源管理器窗口的内容：位置栏 + 工具条 + 文件网格 */
const desktop = useDesktopStore()
const { notify } = desktop

const place = ref('主页')
const query = ref('')
const pickedFile = ref<string | null>(null)

const visibleFiles = computed(() => files.filter((file) => file.name.includes(query.value.trim())))
</script>

<template>
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
                    bg-color="rgba(255, 255, 255, 0.55)"
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
</template>

<style scoped>
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
  border-inline-end: 1px solid var(--ink-line);
}

.ex-place {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--text);
  font-family: var(--body-font);
  font-size: 12.5px;
  text-align: start;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.ex-place:hover {
  background: rgba(255, 255, 255, 0.5);
  color: var(--text);
}

.ex-place.on {
  background: rgba(255, 255, 255, 0.8);
  color: var(--text);
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
  color: var(--text);
}

.glass-field :deep(.v-field) {
  border-radius: 12px;
  font-size: 13px;
}

.glass-field :deep(.v-field__prepend-inner .v-icon) {
  color: var(--text-muted);
  opacity: 1;
}

.glass-field :deep(.v-field__input) {
  color: var(--text);
  font-size: 13px;
  min-height: 34px;
  padding-top: 4px;
  padding-bottom: 4px;
}

.glass-field :deep(input::placeholder) {
  color: var(--text-muted);
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
  background: rgba(255, 255, 255, 0.5);
  color: var(--text);
  font-family: var(--body-font);
  text-align: start;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.file:hover {
  background: rgba(255, 255, 255, 0.62);
}

.file.on {
  background: color-mix(in srgb, var(--accent) 22%, transparent);
  border-color: color-mix(in srgb, var(--accent) 55%, transparent);
}

.file-name {
  font-size: 12.5px;
  font-weight: 500;
  word-break: break-all;
}

.file-meta {
  font-size: 11px;
  color: var(--text-muted);
}

.empty {
  grid-column: 1 / -1;
  margin: 12px 2px;
  font-size: 12.5px;
  color: var(--text-muted);
}


/* 窄屏回退 */
@media (max-width: 1000px) {
  .explorer {
    height: auto;
  }

  .ex-grid {
    max-height: 260px;
  }
}

@media (max-width: 640px) {
  .ex-side {
    display: none;
  }
}
</style>
