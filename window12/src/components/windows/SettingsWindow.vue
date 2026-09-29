<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useDesktopStore } from '../../stores/desktop'

/* 设置窗口的内容：主题色、背景模糊、卡片圆角与效果开关，直接驱动全局令牌 */
const desktop = useDesktopStore()
const { accent, blur, radius, effects } = storeToRefs(desktop)
const accents = desktop.accents
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
                    :aria-label="item.name"
                    :aria-pressed="accent === item.value"
                    @click="accent = item.value"
                  />
                </div>
              </div>

              <div class="set-row">
                <span class="set-label">背景模糊</span>
                <span class="set-value">{{ effects ? blur : 0 }}px</span>
              </div>
              <v-slider
                v-model="blur"
                :min="8"
                :max="40"
                :step="2"
                :disabled="!effects"
                hide-details
                density="compact"
                color="#3d2b0e"
                track-color="rgba(61, 43, 14, 0.22)"
                track-fill-color="rgba(61, 43, 14, 0.7)"
              />

              <div class="set-row">
                <span class="set-label">卡片圆角</span>
                <span class="set-value">{{ radius }}px</span>
              </div>
              <v-slider
                v-model="radius"
                :min="0"
                :max="32"
                :step="2"
                hide-details
                density="compact"
                color="#3d2b0e"
                track-color="rgba(61, 43, 14, 0.22)"
                track-fill-color="rgba(61, 43, 14, 0.7)"
              />

              <v-switch
                v-model="effects"
                class="glass-switch"
                label="透明与模糊效果"
                hide-details
                density="compact"
                color="#3d2b0e"
              />
            </div>
</template>

<style scoped>
/* --------------------------------- 设置内部 -------------------------------- */

.settings {
  padding: 16px 18px 18px;
}

.set-note {
  margin: 0 0 14px;
  font-size: 12.5px;
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
  font-size: 12.5px;
  font-weight: 500;
}

.set-value {
  font-family: var(--display-font);
  font-size: 12.5px;
  color: var(--text-muted);
}

.swatches {
  display: flex;
  gap: 7px;
}

.swatch {
  width: 21px;
  height: 21px;
  border: 1px solid var(--ink-line);
  border-radius: 50%;
  background: var(--sw);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.swatch:hover {
  transform: scale(1.12);
}

.swatch.on {
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.9),
    0 0 0 4px rgba(61, 43, 14, 0.3);
}

.settings :deep(.v-slider) {
  margin-top: 4px;
}

.glass-switch :deep(.v-label) {
  color: var(--text);
  font-size: 12.5px;
  opacity: 1;
}

.glass-switch :deep(.v-switch__track) {
  opacity: 0.4;
}

</style>
