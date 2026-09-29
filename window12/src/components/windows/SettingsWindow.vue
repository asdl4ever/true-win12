<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useDesktopStore } from '../../stores/desktop'

/* 设置窗口的内容：主题色、背景模糊、卡片圆角、果冻强度与效果开关，直接驱动全局令牌 */
const desktop = useDesktopStore()
const { accent, blur, radius, effects, specular, jelly } = storeToRefs(desktop)
const accents = desktop.accents

/* 果冻强度三档：0 关闭 / 0.5 轻柔 / 1 标准 */
const jellyLevels = [
  { label: '关闭', value: 0 },
  { label: '轻柔', value: 0.5 },
  { label: '标准', value: 1 },
]
</script>

<template>
              <div class="settings">
              <p class="set-note">调整外观，桌面上的玻璃卡片会立刻跟着变。</p>

              <div class="set-row">
                <span class="set-label">主题色</span>
                <div class="swatches">
                  <button
                    v-for="item in accents"
                    :key="item.value"
                    class="swatch"
                    :class="{ on: accent === item.value }"
                    :style="{ '--sw': item.value }"
                    type="button"
                    :title="item.name"
                    :aria-label="item.name"
                    :aria-pressed="accent === item.value"
                    @click="desktop.applyAccent(item.value)"
                  />
                </div>
              </div>

              <div class="set-row">
                <span class="set-label">背景模糊</span>
                <span class="set-value">{{ effects ? blur : 0 }}px</span>
              </div>
              <v-slider v-model="blur" :min="8" :max="40" :step="2" :disabled="!effects" hide-details density="compact" />

              <div class="set-row">
                <span class="set-label">卡片圆角</span>
                <span class="set-value">{{ radius }}px</span>
              </div>
              <v-slider v-model="radius" :min="8" :max="32" :step="2" hide-details density="compact" />

              <div class="set-row">
                <span class="set-label">果冻强度</span>
              </div>
              <div class="segmented" role="group" aria-label="果冻强度">
                <button
                  v-for="level in jellyLevels"
                  :key="level.label"
                  class="seg"
                  :class="{ on: jelly === level.value }"
                  type="button"
                  :aria-pressed="jelly === level.value"
                  @click="jelly = level.value"
                >
                  {{ level.label }}
                </button>
              </div>

              <v-switch v-model="effects" class="glass-switch" label="透明与模糊效果" hide-details density="compact" />
              <v-switch v-model="specular" class="glass-switch" label="镜面反光" hide-details density="compact" />
            </div>
</template>

<style scoped>
/* --------------------------------- 设置内部 -------------------------------- */

.settings {
  padding: 16px 18px 18px;
}

.set-note {
  margin: 0 0 14px;
  font-size: var(--fs-label);
  line-height: 1.6;
  color: var(--text-muted);
}

.set-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}

.set-label {
  font-size: var(--fs-label);
  font-weight: var(--fw-medium);
}

.set-value {
  font-family: var(--display-font);
  font-size: var(--fs-label);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.swatches {
  display: flex;
  gap: 7px;
}

/* 色板：press-squash + 选中外圈跟着强调色走 */
.swatch {
  width: 21px;
  height: 21px;
  border: 1px solid var(--glass-edge-strong);
  border-radius: 50%;
  background: var(--sw);
  cursor: pointer;
  transition:
    transform var(--dur-2) var(--spring-jelly),
    box-shadow var(--dur-2) var(--spring-settle);
}

.swatch:hover {
  transform: scale(1.16);
}

.swatch:active {
  transform: scale(0.9);
  transition-duration: var(--dur-1);
}

.swatch.on {
  box-shadow:
    0 0 0 2px var(--glass-solid),
    0 0 0 4px color-mix(in srgb, var(--accent) 55%, transparent);
}

/* 果冻强度：胶囊分段控件 */
.segmented {
  display: flex;
  gap: 2px;
  margin-top: 6px;
  padding: 3px;
  border: 1px solid var(--glass-edge);
  border-radius: var(--r-pill);
  background: var(--glass-thin);
}

.seg {
  flex: 1 1 0;
  height: 26px;
  border: 0;
  border-radius: var(--r-pill);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--body-font);
  font-size: var(--fs-caption);
  font-weight: var(--fw-medium);
  cursor: pointer;
  transition:
    background-color var(--dur-2) var(--spring-settle),
    color var(--dur-2) var(--spring-settle),
    transform var(--dur-2) var(--spring-jelly);
}

.seg:hover {
  color: var(--text);
}

.seg:active {
  transform: scale(0.94);
  transition-duration: var(--dur-1);
}

.seg.on {
  background: color-mix(in srgb, var(--accent) 18%, var(--glass-base));
  color: var(--text);
  font-weight: var(--fw-semi);
}

.settings :deep(.v-slider) {
  margin-top: 4px;
}

.glass-switch :deep(.v-label) {
  color: var(--text);
  font-size: var(--fs-label);
  opacity: 1;
}

.glass-switch :deep(.v-switch__track) {
  opacity: 0.4;
}

</style>
