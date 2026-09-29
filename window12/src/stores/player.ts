import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { tracks } from '../data/music'

/**
 * 伪音乐软件的播放状态。
 * 放在 store 里是因为音乐窗口与任务栏的律动读的是同一份状态；
 * 进度用 window.setInterval 推进（不绑组件作用域），关掉窗口也继续放。
 */
export const usePlayerStore = defineStore('player', () => {
  const index = ref(0)
  const playing = ref(false)
  /** 当前曲目已播放的秒数 */
  const progress = ref(0)

  const current = computed(() => tracks[index.value])
  const percent = computed(() =>
    current.value ? (progress.value / current.value.duration) * 100 : 0,
  )

  let timer: number | undefined

  function stopTimer() {
    window.clearInterval(timer)
    timer = undefined
  }

  function startTimer() {
    if (timer !== undefined) return
    timer = window.setInterval(() => {
      if (progress.value + 1 >= current.value.duration) {
        next()
        return
      }
      progress.value += 1
    }, 1000)
  }

  function toggle() {
    playing.value = !playing.value
    if (playing.value) startTimer()
    else stopTimer()
  }

  function playAt(nextIndex: number) {
    index.value = (nextIndex + tracks.length) % tracks.length
    progress.value = 0
    playing.value = true
    stopTimer()
    startTimer()
  }

  function playTrack(id: string) {
    const found = tracks.findIndex((track) => track.id === id)
    if (found >= 0) playAt(found)
  }

  function next() {
    playAt(index.value + 1)
  }

  function prev() {
    playAt(index.value - 1)
  }

  /** 拖动进度条：按百分比定位 */
  function seek(value: number) {
    progress.value = Math.round((Math.min(Math.max(value, 0), 100) / 100) * current.value.duration)
  }

  return { tracks, index, current, playing, progress, percent, toggle, playTrack, next, prev, seek }
})
