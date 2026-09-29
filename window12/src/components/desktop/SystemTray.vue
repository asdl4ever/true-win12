<script setup lang="ts">
import { useClock } from '../../composables/useClock'
import { useDesktopStore } from '../../stores/desktop'

/* 右上角的状态区：蓝牙 / wifi / 音量 / 电量 / 时间 / 通知。
   直接贴在壁纸上，不带背景与边框。 */
const desktop = useDesktopStore()
const { time, shortDate } = useClock()
</script>

<template>
  <div class="tray">
    <v-icon class="tray-icon" icon="mdi-bluetooth" size="15" />
    <v-icon class="tray-icon" icon="mdi-wifi" size="15" />
    <v-icon class="tray-icon" icon="mdi-volume-high" size="15" />
    <v-icon class="tray-icon" icon="mdi-battery-80" size="15" />

    <span class="tray-clock">
      <strong>{{ time }}</strong>
      <em>{{ shortDate }}</em>
    </span>

    <button
      class="tray-bell"
      type="button"
      aria-label="通知"
      @click="desktop.notify('没有新的通知')"
    >
      <v-icon icon="mdi-bell-outline" size="17" />
    </button>
  </div>
</template>

<style scoped>
.tray {
  position: fixed;
  top: 14px;
  right: 20px;
  z-index: 82;
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 4px 6px;
  /* 按需求去掉背景与边框，直接浮在壁纸上 */
  background: none;
  border: 0;
  color: var(--text);
  user-select: none;
}

.tray-icon {
  opacity: 0.78;
}

.tray-clock {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  line-height: 1.15;
}

.tray-clock strong {
  font-family: var(--display-font);
  font-size: var(--fs-subtitle);
  font-weight: var(--fw-bold);
  font-variant-numeric: tabular-nums;
}

.tray-clock em {
  font-style: normal;
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

.tray-bell {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 1px solid transparent;
  border-radius: 50%;
  background: var(--glass-thin);
  color: inherit;
  opacity: 0.82;
  cursor: pointer;
  transition:
    background-color var(--dur-2) var(--spring-settle),
    border-color var(--dur-2) var(--spring-settle),
    box-shadow var(--dur-2) var(--spring-settle),
    opacity var(--dur-2) var(--spring-settle),
    transform var(--dur-2) var(--spring-jelly);
}

.tray-bell:hover {
  background: var(--glass-solid);
  border-color: var(--glass-edge-strong);
  box-shadow: var(--shadow-1);
  opacity: 1;
  transform: scale(1.08);
}

.tray-bell:active {
  transform: scale(0.92);
  transition-duration: var(--dur-1);
}
</style>
