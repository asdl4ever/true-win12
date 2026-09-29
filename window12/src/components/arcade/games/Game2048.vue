<script setup lang="ts">
import { onMounted, ref } from 'vue'

type Direction = 'left' | 'right' | 'up' | 'down'

const wrapEl = ref<HTMLElement | null>(null)
const board = ref<number[]>(Array(16).fill(0))
const score = ref(0)
const best = ref(0)
const won = ref(false)
const status = ref<'running' | 'over'>('running')

function toGrid() {
  const grid: number[][] = []
  for (let row = 0; row < 4; row++) grid.push(board.value.slice(row * 4, row * 4 + 4))
  return grid
}

/* 把一条线里的数字往一侧压紧并合并 */
function slide(line: number[]) {
  const items = line.filter((value) => value > 0)
  const out: number[] = []
  let gained = 0

  for (let i = 0; i < items.length; i++) {
    if (items[i] === items[i + 1]) {
      const merged = items[i] * 2
      out.push(merged)
      gained += merged
      i += 1
    } else {
      out.push(items[i])
    }
  }

  while (out.length < 4) out.push(0)
  return { line: out, gained }
}

function lineOf(grid: number[][], dir: Direction, index: number) {
  const row = grid[index]
  if (dir === 'left') return row.slice()
  if (dir === 'right') return row.slice().reverse()
  const column = grid.map((item) => item[index])
  return dir === 'up' ? column : column.reverse()
}

function writeLine(grid: number[][], dir: Direction, index: number, line: number[]) {
  const values = dir === 'right' || dir === 'down' ? line.slice().reverse() : line
  if (dir === 'left' || dir === 'right') {
    grid[index] = values
    return
  }
  values.forEach((value, row) => {
    grid[row][index] = value
  })
}

function addTile() {
  const empty = board.value
    .map((value, index) => (value === 0 ? index : -1))
    .filter((index) => index >= 0)
  if (!empty.length) return
  board.value[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < 0.9 ? 2 : 4
}

function canMove() {
  if (board.value.includes(0)) return true
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const value = board.value[row * 4 + col]
      if (col < 3 && value === board.value[row * 4 + col + 1]) return true
      if (row < 3 && value === board.value[(row + 1) * 4 + col]) return true
    }
  }
  return false
}

function check() {
  if (board.value.some((value) => value >= 2048)) won.value = true
  if (!canMove()) {
    status.value = 'over'
    best.value = Math.max(best.value, score.value)
  }
}

function move(dir: Direction) {
  if (status.value === 'over') return

  const grid = toGrid()
  const before = JSON.stringify(grid)
  let gained = 0

  for (let index = 0; index < 4; index++) {
    const result = slide(lineOf(grid, dir, index))
    gained += result.gained
    writeLine(grid, dir, index, result.line)
  }

  if (JSON.stringify(grid) === before) return

  score.value += gained
  board.value = grid.flat()
  addTile()
  check()
}

function start() {
  board.value = Array(16).fill(0)
  score.value = 0
  won.value = false
  status.value = 'running'
  addTile()
  addTile()
  wrapEl.value?.focus()
}

function onKey(event: KeyboardEvent) {
  const dirs: Record<string, Direction | undefined> = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
    a: 'left',
    d: 'right',
    w: 'up',
    s: 'down',
  }
  const dir = dirs[event.key]
  if (!dir) return
  event.preventDefault()
  move(dir)
}

function tileStyle(value: number) {
  if (!value) return { background: 'rgba(61, 43, 14, 0.07)' }
  const step = Math.log2(value)
  return {
    background: `color-mix(in srgb, var(--accent) ${Math.min(14 + step * 7, 80)}%, rgba(255, 255, 255, 0.86))`,
    color: step >= 7 ? '#fffdf5' : 'var(--text)',
    fontSize: value >= 1000 ? '17px' : '21px',
  }
}

onMounted(start)
</script>

<template>
  <div ref="wrapEl" class="g2048" tabindex="0" @keydown.stop="onKey" @click="wrapEl?.focus()">
    <div class="g-bar">
      <span class="g-score">得分 {{ score }}</span>
      <span class="g-best">最高 {{ best }}</span>
      <v-btn class="g-btn" variant="text" size="small" @click.stop="start">重开</v-btn>
    </div>

    <div class="g-stage">
      <div class="g-grid">
        <div v-for="(value, index) in board" :key="index" class="g-cell" :style="tileStyle(value)">
          {{ value || '' }}
        </div>
      </div>
      <div v-if="status === 'over'" class="g-mask">
        <p>没有可合并的数字了，本局 {{ score }} 分</p>
        <v-btn class="g-btn primary" variant="flat" size="small" @click.stop="start">再来一局</v-btn>
      </div>
    </div>

    <p class="g-note">
      {{ won ? '已凑出 2048，还能继续冲更高分。' : '方向键合并相同数字，目标 2048。' }}
    </p>
  </div>
</template>

<style scoped>
.g2048 {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px 16px;
  outline: none;
}

.g-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12.5px;
  color: var(--text-muted);
}

.g-score {
  font-family: var(--display-font);
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}

.g-btn {
  margin-inline-start: auto;
  color: var(--text);
}

.g-btn.primary {
  background: var(--accent);
  color: #fffdf5;
}

.g-stage {
  position: relative;
}

.g-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 8px;
  border-radius: 16px;
  background: rgba(61, 43, 14, 0.08);
}

.g-cell {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 12px;
  font-family: var(--display-font);
  font-weight: 700;
  font-size: 21px;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.g-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 16px;
  background: rgba(255, 253, 245, 0.86);
  color: var(--text);
  text-align: center;
}

.g-mask p {
  margin: 0;
  font-size: 12.5px;
}

.g-note {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}
</style>
