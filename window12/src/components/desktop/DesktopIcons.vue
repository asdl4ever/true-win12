<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { desktopIcons } from '../../data/apps'
import { useDesktopStore } from '../../stores/desktop'
import type { DesktopIcon } from '../../types/desktop'

/* 桌面图标：单击选中，双击打开 */
const desktop = useDesktopStore()
const { selectedIcon: selected } = storeToRefs(desktop)
const { openPanel, notify } = desktop

function openIcon(icon: DesktopIcon) {
  /* 双击打开时清掉选中态，避免图标一直亮着 */
  selected.value = null
  if (icon.panel) {
    openPanel(icon.panel)
    return
  }
  notify(`${icon.label} 暂时打不开`)
}
</script>

<template>
        <aside class="desk-icons">
        <button
          v-for="icon in desktopIcons"
          :key="icon.id"
          class="desk-icon glass-thin"
          :class="{ selected: selected === icon.id }"
          type="button"
          @click.stop="selected = icon.id"
          @dblclick="openIcon(icon)"
        >
          <v-icon :icon="icon.icon" size="27" />
          <span>{{ icon.label }}</span>
        </button>
      </aside>
</template>

<style scoped>
.desk-icons {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 88px;
}



/* 桌面图标：M1 薄雾玻璃块（.glass-thin 提供背景、模糊、边框、内发光）。
   圆角用 --r-card 而不是 M1 默认的 --r-inner——图标块面积较大，太小的圆角会显得方。
   模糊仍跟着 --blur 走，设置面板里的滑杆对它同样生效。 */
.desk-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: var(--sp-3) var(--sp-1) var(--sp-2);
  border-radius: var(--r-card);
  color: var(--text);
  font-family: var(--body-font);
  font-size: var(--fs-caption);
  line-height: 1.2;
  cursor: pointer;
  transition:
    background-color var(--dur-2) var(--spring-settle),
    border-color var(--dur-2) var(--spring-settle),
    box-shadow var(--dur-2) var(--spring-settle),
    transform var(--dur-2) var(--spring-jelly);
}

/* hover-lift / press-squash */
.desk-icon:hover {
  transform: translateY(-2px) scale(1.05);
}

.desk-icon:active {
  transform: scale(0.95);
  transition-duration: var(--dur-1);
}

/* 悬浮时图标本身轻微放大，给出"能点开"的即时反馈 */
.desk-icon :deep(.v-icon) {
  transition: transform var(--dur-3) var(--spring-jelly);
}

.desk-icon:hover :deep(.v-icon) {
  transform: scale(1.2);
}

/* 选中：底子叠一层强调色，外圈补一道高光圈 */
.desk-icon.selected {
  background-color: color-mix(in srgb, var(--accent) 16%, var(--glass-base));
  border-color: color-mix(in srgb, var(--accent) 34%, var(--glass-edge));
  box-shadow:
    var(--shadow-1),
    0 0 0 2px var(--glass-edge-strong);
}

/* 窄屏：图标栏改成横向排一行 */
@media (max-width: 1000px) {
  .desk-icons {
    flex-direction: row;
    flex-wrap: wrap;
    width: 100%;
  }
}
</style>
