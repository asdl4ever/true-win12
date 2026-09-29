<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { files } from '../../data/explorer'
import { useDesktopStore } from '../../stores/desktop'

const desktop = useDesktopStore()
const { launchableApps } = storeToRefs(desktop)

const query = ref('')
const active = ref(0)
const field = ref<{ focus: () => void } | null>(null)

type Hit = {
  id: string
  label: string
  meta: string
  icon: string
  run: () => void
}

/* 应用：装了游戏也会出现在这里 */
const appHits = computed<Hit[]>(() => {
  const keyword = query.value.trim()
  return launchableApps.value
    .filter((app) => !keyword || app.label.includes(keyword))
    .slice(0, 7)
    .map((app) => ({
      id: `app-${app.id}`,
      label: app.label,
      meta: '应用',
      icon: app.icon,
      run: () => {
        if (app.game) {
          desktop.playGame(app.game)
        } else if (app.panel) {
          desktop.openPanel(app.panel)
        } else {
          desktop.notify(`${app.label} 正在开发中`)
          return
        }
        desktop.closeSearch()
      },
    }))
})

/* 文件：有关键词才搜，避免空搜索时铺一屏文件 */
const fileHits = computed<Hit[]>(() => {
  const keyword = query.value.trim()
  if (!keyword) return []
  return files
    .filter((file) => file.name.includes(keyword))
    .slice(0, 5)
    .map((file) => ({
      id: `file-${file.name}`,
      label: file.name,
      meta: file.meta,
      icon: file.icon,
      run: () => {
        desktop.openPanel('explorer')
        desktop.notify(`已在文件资源管理器中打开 ${file.name}`)
        desktop.closeSearch()
      },
    }))
})

const hits = computed(() => [...appHits.value, ...fileHits.value])
const keyword = computed(() => query.value.trim())

watch(query, () => {
  active.value = 0
})

function move(step: number) {
  const total = hits.value.length
  if (!total) return
  active.value = (active.value + step + total) % total
}

function run(index = active.value) {
  hits.value[index]?.run()
}

onKeyStroke('Escape', () => desktop.closeSearch())

/* 打开即聚焦（Vuetify 的输入框暴露了 focus 方法） */
onMounted(() => field.value?.focus())
</script>

<template>
  <div class="search-overlay" @click.self="desktop.closeSearch()">
    <section class="search-box glass-dense" role="dialog" aria-label="搜索">
      <v-text-field
        ref="field"
        v-model="query"
        class="glass-field"
        density="comfortable"
        hide-details
        variant="solo"
        flat
        bg-color="transparent"
        placeholder="搜索应用、文件与设置"
        prepend-inner-icon="mdi-magnify"
        append-inner-icon="mdi-close"
        @click:append-inner="desktop.closeSearch()"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="run()"
      />

      <ul v-if="hits.length" class="hits">
        <li v-for="(hit, index) in hits" :key="hit.id">
          <button
            class="hit"
            :class="{ on: index === active }"
            type="button"
            @mouseenter="active = index"
            @click="hit.run()"
          >
            <span class="hit-icon">
              <v-icon :icon="hit.icon" size="17" />
            </span>
            <span class="hit-label">{{ hit.label }}</span>
            <span class="hit-meta">{{ hit.meta }}</span>
          </button>
        </li>
      </ul>

      <p v-else class="hits-empty">
        {{ keyword ? `没有匹配「${keyword}」的内容` : '输入关键词开始搜索' }}
      </p>

      <footer class="search-foot">
        <span><b>↑↓</b> 选择</span>
        <span><b>Enter</b> 打开</span>
        <span><b>Esc</b> 关闭</span>
      </footer>
    </section>
  </div>
</template>

<style scoped>
/* 整屏虚化，面板落在屏幕中央、上边在 30% 高度（上下 3:7） */
.search-overlay {
  position: fixed;
  inset: 0;
  z-index: 78;
  background: var(--scrim);
  backdrop-filter: blur(var(--blur)) saturate(140%);
  -webkit-backdrop-filter: blur(var(--blur)) saturate(140%);
}

/* M3 厚玻璃：材质、圆角、阴影全部来自 .glass-dense */
.search-box {
  position: absolute;
  left: 50%;
  top: 30vh;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(620px, 92vw);
  max-height: 58vh;
  padding: 16px;
  transition: transform var(--dur-3) var(--spring-jelly);
}

.hits {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: auto;
  min-height: 0;
}

.hit {
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  padding: 9px 11px;
  border: 1px solid transparent;
  border-radius: var(--r-control);
  background: transparent;
  color: var(--text);
  font-family: var(--body-font);
  font-size: var(--fs-label);
  text-align: start;
  cursor: pointer;
  transition:
    background-color var(--dur-2) var(--spring-settle),
    border-color var(--dur-2) var(--spring-settle);
}

.hit.on {
  background: color-mix(in srgb, var(--accent) 14%, var(--glass-base));
  border-color: color-mix(in srgb, var(--accent) 32%, var(--glass-edge));
  box-shadow: var(--shadow-1);
}

.hit-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  border-radius: var(--r-inner);
  background: color-mix(in srgb, var(--accent) 16%, var(--glass-base));
  color: var(--accent-deep);
}

.hit-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hit-meta {
  margin-inline-start: auto;
  flex: 0 0 auto;
  font-size: var(--fs-caption);
  color: var(--text-muted);
}

.hits-empty {
  margin: 6px 2px;
  font-size: var(--fs-label);
  color: var(--text-muted);
}

.search-foot {
  display: flex;
  gap: 14px;
  padding: 10px 4px 2px;
  border-top: 1px solid var(--ink-line);
  font-size: var(--fs-caption);
  color: var(--text-muted);
}

.search-foot b {
  font-family: var(--display-font);
  font-weight: var(--fw-bold);
  color: var(--text);
}

/* 进出场：外面淡入，面板再轻轻上浮一点（类名由外层 transition 打到根节点上）。
   过渡期间摘掉全屏模糊 */
.search-enter-active,
.search-leave-active {
  transition: opacity var(--dur-3) var(--spring-settle);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.search-enter-from,
.search-leave-to {
  opacity: 0;
}

.search-enter-from .search-box,
.search-leave-to .search-box {
  transform: translateX(-50%) translateY(-12px) scale(0.98);
}
</style>
