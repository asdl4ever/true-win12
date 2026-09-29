import { onBeforeUnmount, onMounted } from 'vue'

/**
 * 液态玻璃的镜面反光：单例指针跟踪。
 *
 * 只在 document 上挂一个 pointermove，用 closest() 找到当前指针下的玻璃元素，
 * 把指针在元素内的百分比坐标写进 --gx / --gy，并把 --gl 置 1。
 * 坐标写入经 rAF 节流，一帧最多量一次 rect、写一次样式。
 *
 * 之所以不每个元素各挂一个监听：玻璃元素最多时能到几十个，
 * 单例监听既省内存也避免了同时触发大量样式写入。
 */

const GLASS_SELECTOR = '.glass, .glass-dense, .glass-thin'

type Hit = { el: HTMLElement; x: number; y: number }

let listeners = 0
let frame = 0
let pending: Hit | null = null
let lit: HTMLElement | null = null

function flush() {
  frame = 0
  const hit = pending
  pending = null
  if (!hit) return

  if (lit && lit !== hit.el) lit.style.setProperty('--gl', '0')

  const rect = hit.el.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  hit.el.style.setProperty('--gx', `${((hit.x - rect.left) / rect.width) * 100}%`)
  hit.el.style.setProperty('--gy', `${((hit.y - rect.top) / rect.height) * 100}%`)
  hit.el.style.setProperty('--gl', '1')
  lit = hit.el
}

function onMove(event: PointerEvent) {
  const target = event.target as HTMLElement | null
  const el = target?.closest?.(GLASS_SELECTOR) as HTMLElement | null

  if (!el) {
    // 指针移出所有玻璃：熄掉上一次点亮的那块
    if (lit) {
      lit.style.setProperty('--gl', '0')
      lit = null
    }
    return
  }

  pending = { el, x: event.clientX, y: event.clientY }
  if (!frame) frame = requestAnimationFrame(flush)
}

function release() {
  if (lit) {
    lit.style.setProperty('--gl', '0')
    lit = null
  }
  if (frame) {
    cancelAnimationFrame(frame)
    frame = 0
  }
  pending = null
}

/** 在桌面外壳里调用一次即可；enabled 为假时完全不挂监听 */
export function useSpecular(enabled: () => boolean) {
  onMounted(() => {
    if (!enabled() || listeners > 0) {
      listeners += 1
      return
    }
    listeners += 1
    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', release)
    window.addEventListener('blur', release)
  })

  onBeforeUnmount(() => {
    listeners = Math.max(0, listeners - 1)
    if (listeners > 0) return
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerleave', release)
    window.removeEventListener('blur', release)
    release()
  })
}
