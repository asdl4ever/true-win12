<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDesktopStore } from '../../../stores/desktop'

const CELL = 16
const COLS = 20
const ROWS = 20

const canvasEl = ref<HTMLCanvasElement | null>(null)
const wrapEl = ref<HTMLElement | null>(null)
const score = ref(0)
const best = ref(0)
const status = ref<'ready' | 'running' | 'over'>('ready')

type Point = { x: number; y: number }

let snake: Point[] = []
let food: Point = { x: 0, y: 0 }
let dir: Point = { x: 1, y: 0 }
let queued: Point | null = null
let timer: number | undefined

/* 画布内的颜色也要走令牌：从宿主元素上读计算值，主题换了立刻跟着换 */
function tokenColor(name: string, fallback: string) {
  const styles = canvasEl.value ? getComputedStyle(canvasEl.value) : null
  return styles?.getPropertyValue(name).trim() || fallback
}

function draw() {
  const ctx = canvasEl.value?.getContext('2d')
  if (!ctx) return
  const size = COLS * CELL
  ctx.clearRect(0, 0, size, size)

  ctx.strokeStyle = tokenColor('--ink-100', 'rgba(74, 56, 20, 0.1)')
  ctx.lineWidth = 1
  for (let i = 1; i < COLS; i++) {
    ctx.beginPath()
    ctx.moveTo(i * CELL, 0)
    ctx.lineTo(i * CELL, size)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i * CELL)
    ctx.lineTo(size, i * CELL)
    ctx.stroke()
  }

  /* 食物用暖红（苹果色），和蛇身的强调色始终拉开距离 */
  ctx.fillStyle = tokenColor('--danger', '#d9564a')
  ctx.beginPath()
  ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = tokenColor('--accent', '#d99b1e')
  snake.forEach((seg, index) => {
    ctx.globalAlpha = index === 0 ? 1 : 0.6
    ctx.beginPath()
    ctx.roundRect(seg.x * CELL + 1.5, seg.y * CELL + 1.5, CELL - 3, CELL - 3, 5)
    ctx.fill()
  })
  ctx.globalAlpha = 1
}

function reset() {
  snake = [
    { x: 6, y: 10 },
    { x: 5, y: 10 },
    { x: 4, y: 10 },
  ]
  dir = { x: 1, y: 0 }
  queued = null
  score.value = 0
  food = { x: 13, y: 10 }
  draw()
}

function placeFood() {
  const free: Point[] = []
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!snake.some((seg) => seg.x === x && seg.y === y)) free.push({ x, y })
    }
  }
  food = free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 }
}

function speed() {
  return Math.max(80, 170 - score.value)
}

function run() {
  window.clearInterval(timer)
  timer = window.setInterval(step, speed())
}

function step() {
  if (queued) {
    dir = queued
    queued = null
  }

  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }
  const outOfWall = head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS
  if (outOfWall || snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
    window.clearInterval(timer)
    best.value = Math.max(best.value, score.value)
    status.value = 'over'
    return
  }

  snake.unshift(head)
  if (head.x === food.x && head.y === food.y) {
    score.value += 10
    placeFood()
    if (score.value % 50 === 0) run()
  } else {
    snake.pop()
  }
  draw()
}

function start() {
  reset()
  status.value = 'running'
  run()
  wrapEl.value?.focus()
}

function onKey(event: KeyboardEvent) {
  const next: Point | undefined = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    w: { x: 0, y: -1 },
    s: { x: 0, y: 1 },
    a: { x: -1, y: 0 },
    d: { x: 1, y: 0 },
  }[event.key]

  if (next) {
    event.preventDefault()
    if (status.value !== 'running') return
    const current = queued ?? dir
    if (next.x === -current.x && next.y === -current.y) return
    queued = next
    return
  }

  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    start()
  }
}

const desktop = useDesktopStore()

onMounted(() => {
  reset()
  wrapEl.value?.focus()
})

/* 强调色/主题变了就重绘——画布不会自己跟着 CSS 变量刷新 */
watch(
  () => [desktop.accent, desktop.effects],
  () => draw(),
)

onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <div ref="wrapEl" class="snake" tabindex="0" @keydown.stop="onKey" @click="wrapEl?.focus()">
    <div class="snake-bar">
      <span class="snake-score">得分 {{ score }}</span>
      <span class="snake-best">最高 {{ best }}</span>
    </div>

    <div class="snake-stage">
      <canvas ref="canvasEl" :width="COLS * CELL" :height="ROWS * CELL"></canvas>
      <div v-if="status !== 'running'" class="snake-mask">
        <v-icon
          :icon="status === 'ready' ? 'mdi-gamepad-variant-outline' : 'mdi-close-circle-outline'"
          size="24"
        />
        <p>{{ status === 'ready' ? '方向键或 WASD 控制' : `本局 ${score} 分` }}</p>
        <v-btn class="snake-btn" variant="flat" size="small" @click.stop="start">
          {{ status === 'ready' ? '开始' : '再来一局' }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.snake {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px 16px;
  outline: none;
}

.snake-bar {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: var(--fs-label);
}

.snake-score {
  font-family: var(--display-font);
  font-size: var(--fs-title);
  font-weight: var(--fw-bold);
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.snake-best {
  color: var(--text-muted);
}

.snake-stage {
  position: relative;
  width: 100%;
  display: grid;
  place-items: center;
}

canvas {
  width: 100%;
  max-width: 320px;
  border-radius: var(--r-card);
  background: var(--glass-thin);
}

.snake-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: var(--r-card);
  background: var(--glass-solid);
  color: var(--text);
  text-align: center;
}

.snake-mask p {
  margin: 0;
  font-size: var(--fs-caption);
  color: var(--text-muted);
}

.snake-btn {
  background: var(--accent);
  color: var(--accent-contrast);
  transition:
    background-color var(--dur-2) var(--spring-settle),
    transform var(--dur-2) var(--spring-jelly);
}

.snake-btn:hover {
  background: var(--accent-deep);
}

.snake-btn:active {
  transform: scale(0.94);
  transition-duration: var(--dur-1);
}
</style>
