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
          class="desk-icon"
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



/* 透明玻璃图标块。
   浅色壁纸上想看出"玻璃"，靠的不是底子有多白，而是三件事：
   ① 底子几乎透明（10% 白），壁纸要透得出来；
   ② 135° 一道反光 + 内圈高光边，模拟玻璃厚度；
   ③ 背景轻微提饱和提亮——透过玻璃的那块壁纸会更"润"，这是玻璃的观感来源。
   圆角与模糊仍跟着 --radius / --blur 走，设置面板里的滑杆对它同样生效。 */
.desk-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 4px 8px;
  background-color: rgba(255, 255, 255, 0.1);
  background-image: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.32),
    rgba(255, 255, 255, 0.05) 44%,
    rgba(255, 255, 255, 0) 74%
  );
  backdrop-filter: blur(calc(var(--blur) * 0.45)) saturate(180%) brightness(1.04);
  -webkit-backdrop-filter: blur(calc(var(--blur) * 0.45)) saturate(180%) brightness(1.04);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: calc(var(--radius) - 4px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    inset 0 -1px 1px rgba(255, 255, 255, 0.16),
    inset 1px 0 0 rgba(255, 255, 255, 0.3),
    inset -1px 0 0 rgba(255, 255, 255, 0.2),
    0 8px 32px rgba(0, 0, 0, 0.1);
  color: var(--text);
  font-family: var(--body-font);
  font-size: 11px;
  line-height: 1.2;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.desk-icon:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.46);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    inset 0 -1px 1px rgba(255, 255, 255, 0.2),
    inset 1px 0 0 rgba(255, 255, 255, 0.38),
    inset -1px 0 0 rgba(255, 255, 255, 0.24),
    0 10px 36px rgba(0, 0, 0, 0.14);
}

/* 选中：底子稍实一点，外圈补一道强调色环 */
.desk-icon.selected {
  background-color: rgba(255, 255, 255, 0.34);
  border-color: rgba(255, 255, 255, 0.66);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    inset 0 -1px 1px rgba(255, 255, 255, 0.24),
    inset 1px 0 0 rgba(255, 255, 255, 0.44),
    inset -1px 0 0 rgba(255, 255, 255, 0.3),
    0 12px 40px rgba(0, 0, 0, 0.16),
    0 0 0 2px color-mix(in srgb, var(--accent) 45%, transparent);
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
