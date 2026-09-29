<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

const ROUND = 30
const holes = Array.from({ length: 9 }, (_, index) => index)

const active = ref<number | null>(null)
const score = ref(0)
const best = ref(0)
const misses = ref(0)
const left = ref(ROUND)
const status = ref<'ready' | 'running' | 'over'>('ready')

let spawnTimer: number | undefined
let hideTimer: number | undefined
let tickTimer: number | undefined

/* 分数越高，冒头越快、待得越短 */
function gap() {
  return Math.max(420, 900 - score.value * 40)
}

function life() {
  return Math.max(380, 850 - score.value * 40)
}

function spawn() {
  active.value = Math.floor(Math.random() * holes.length)
  hideTimer = window.setTimeout(() => {
    if (active.value === null) return
    misses.value += 1
    active.value = null
    if (status.value === 'running') spawnTimer = window.setTimeout(spawn, gap())
  }, life())
}

function hit(index: number) {
  if (status.value !== 'running' || active.value !== index) return
  score.value += 10
  active.value = null
  window.clearTimeout(hideTimer)
  spawnTimer = window.setTimeout(spawn, gap())
}

function clearTimers() {
  window.clearTimeout(spawnTimer)
  window.clearTimeout(hideTimer)
  window.clearInterval(tickTimer)
}

function start() {
  clearTimers()
  score.value = 0
  misses.value = 0
  left.value = ROUND
  active.value = null
  status.value = 'running'

  tickTimer = window.setInterval(() => {
    left.value -= 1
    if (left.value <= 0) {
      clearTimers()
      active.value = null
      best.value = Math.max(best.value, score.value)
      status.value = 'over'
    }
  }, 1000)

  spawn()
}

onBeforeUnmount(clearTimers)
</script>

<template>
  <div class="wam">
    <div class="wam-bar">
      <span class="wam-score">得分 {{ score }}</span>
      <span class="wam-misses">漏掉 {{ misses }}</span>
      <span class="wam-best">最高 {{ best }}</span>
    </div>

    <v-progress-linear
      :model-value="(left / ROUND) * 100"
      height="5"
      rounded
      color="#3d2b0e"
      bg-color="rgba(61, 43, 14, 0.16)"
    />

    <div class="wam-grid">
      <button
        v-for="index in holes"
        :key="index"
        class="wam-hole"
        type="button"
        :aria-label="`第 ${index + 1} 个洞`"
        @click="hit(index)"
      >
        <span v-if="active === index" class="wam-mole"></span>
      </button>
    </div>

    <div v-if="status !== 'running'" class="wam-panel">
      <p class="wam-hint">
        {{
          status === 'ready' ? `30 秒内敲中尽量多的地鼠` : `时间到，本局 ${score} 分，漏掉 ${misses} 只`
        }}
      </p>
      <v-btn class="wam-btn" variant="flat" size="small" @click="start">
        {{ status === 'ready' ? '开始' : '再来一局' }}
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.wam {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px 16px;
}

.wam-bar {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 12.5px;
  color: var(--text-muted);
}

.wam-score {
  font-family: var(--display-font);
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}

.wam-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.wam-hole {
  position: relative;
  aspect-ratio: 1;
  display: grid;
  place-items: end center;
  padding: 0 0 6px;
  border: 1px solid rgba(61, 43, 14, 0.12);
  border-radius: 14px;
  background: rgba(61, 43, 14, 0.08);
  cursor: pointer;
  overflow: hidden;
  transition: background 0.2s ease;
}

.wam-hole:hover {
  background: rgba(61, 43, 14, 0.14);
}

.wam-mole {
  position: relative;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: #a8763c;
  box-shadow: inset 0 -6px 0 rgba(0, 0, 0, 0.16);
  animation: mole-up 0.16s ease-out;
}

.wam-mole::before,
.wam-mole::after {
  content: '';
  position: absolute;
  top: 18px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #3d2b0e;
}

.wam-mole::before {
  left: 13px;
}

.wam-mole::after {
  right: 13px;
}

.wam-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  padding-top: 2px;
}

.wam-hint {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}

.wam-btn {
  background: var(--accent);
  color: #fffdf5;
}

@keyframes mole-up {
  from {
    transform: translateY(16px);
  }
  to {
    transform: none;
  }
}
</style>
