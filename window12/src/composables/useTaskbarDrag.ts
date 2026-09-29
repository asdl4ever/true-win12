import { computed, onBeforeUnmount, ref } from 'vue'

/** 位移小于这个值算点击，不抢按钮的事件 */
const DRAG_THRESHOLD = 6

type Options = {
  /** 收起状态下点一下任务栏（不是拖动）时回调，交给使用方决定收起什么 */
  onEmptyClick?: () => void
}

/**
 * 任务栏「向下拖拽隐藏」：只支持向下拖，拖过行程一半就收起，露出底部一小截，
 * 鼠标移上去或点一下再弹出来。
 */
export function useTaskbarDrag(options: Options = {}) {
  const taskbarEl = ref<HTMLElement | null>(null)
  const barHidden = ref(false)
  const barDragging = ref(false)
  const offset = ref(0)

  let startY = 0
  let startOffset = 0
  let hideDistance = 0

  const barStyle = computed(() =>
    barDragging.value ? { transform: `translateY(${offset.value}px)` } : undefined,
  )

  /** 收起行程 = 栏高 + 距底边距离 − 保留露出的一小截 */
  function measureDistance() {
    const el = taskbarEl.value
    if (!el) return 60
    const styles = getComputedStyle(el)
    const bottom = Number.parseFloat(styles.getPropertyValue('--taskbar-bottom')) || 0
    const sliver = Number.parseFloat(styles.getPropertyValue('--taskbar-sliver')) || 10
    return el.offsetHeight + bottom - sliver
  }

  /* 拖过之后的那次 click 要拦掉，否则松手会顺手触发被拖到的按钮 */
  function swallowClick(event: Event) {
    event.stopPropagation()
    event.preventDefault()
    document.removeEventListener('click', swallowClick, true)
  }

  function unbind() {
    document.removeEventListener('pointermove', moveDrag)
    document.removeEventListener('pointerup', endDrag)
    document.removeEventListener('pointercancel', endDrag)
  }

  function startBarDrag(event: PointerEvent) {
    if (event.button !== 0 || window.matchMedia('(max-width: 1000px)').matches) return
    unbind()
    document.removeEventListener('click', swallowClick, true)
    hideDistance = measureDistance()
    startY = event.clientY
    startOffset = barHidden.value ? hideDistance : 0
    barDragging.value = false
    document.addEventListener('pointermove', moveDrag)
    document.addEventListener('pointerup', endDrag)
    document.addEventListener('pointercancel', endDrag)
  }

  function moveDrag(event: PointerEvent) {
    const dy = event.clientY - startY
    if (!barDragging.value) {
      if (Math.abs(dy) < DRAG_THRESHOLD) return
      barDragging.value = true
      barHidden.value = false
      options.onEmptyClick?.()
    }
    /* 只认向下拖，向上最多回到原位 */
    offset.value = Math.min(Math.max(startOffset + dy, 0), hideDistance)
  }

  function endDrag() {
    unbind()
    if (!barDragging.value) return
    barDragging.value = false
    document.addEventListener('click', swallowClick, true)
    /* 拖过行程一半就收起，否则弹回原位 */
    barHidden.value = offset.value >= hideDistance / 2
    offset.value = 0
  }

  function onBarClick() {
    if (barHidden.value) {
      barHidden.value = false
      return
    }
    options.onEmptyClick?.()
  }

  function onBarKey(event: KeyboardEvent) {
    if (!barHidden.value || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    barHidden.value = false
  }

  function dispose() {
    unbind()
    document.removeEventListener('click', swallowClick, true)
  }

  onBeforeUnmount(dispose)

  return { taskbarEl, barHidden, barDragging, barStyle, startBarDrag, onBarClick, onBarKey }
}
