import { useIntervalFn, useNow } from '@vueuse/core'
import { computed } from 'vue'

/**
 * 秒级时钟。
 * VueUse 15 的 useNow 默认跑 rAF、且每次调用各持一份，这里换成 useIntervalFn 的
 * 1 秒调度：只在需要时更新，组件卸载时由 VueUse 自动停表。
 */
export function useClock() {
  const now = useNow({ scheduler: (tick) => useIntervalFn(tick, 1000) })

  const time = computed(() =>
    now.value.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
  )
  const seconds = computed(() => now.value.getSeconds().toString().padStart(2, '0'))
  const date = computed(() =>
    now.value.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }),
  )
  const shortDate = computed(() =>
    now.value.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }),
  )

  return { time, seconds, date, shortDate }
}
