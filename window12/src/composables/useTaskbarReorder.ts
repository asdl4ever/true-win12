import { unrefElement } from '@vueuse/core'
import { ref, type ComponentPublicInstance, type Ref } from 'vue'

/** 按下后横向移动超过这个距离才算拖动，避免抢掉点击 */
const DRAG_THRESHOLD = 5

/** 拖动时图标最多横向滑出这么远，避免指针移出列表后飞走 */
const MAX_SLIDE = 56

type Options = {
  /** 按钮容器的模板 ref（可能挂在 TransitionGroup 上） */
  listEl: Ref<ComponentPublicInstance | HTMLElement | null>
  /** 把 id 移到某个槽位（由使用方决定怎么排序） */
  onMove: (id: string, index: number) => void
}

/**
 * 任务栏按钮的拖动排序：
 * 按住按钮横向拖动，指针落在哪个槽位上就吸附到哪，松手即定。
 * 全程只认横向位移——竖向拖动既不重排、也不产生位移，图标始终只左右滑动。
 * 只负责手势与"落在第几个槽位"，排序规则与渲染顺序由使用方掌握。
 */
export function useTaskbarReorder(options: Options) {
  const { listEl } = options
  const draggingId = ref<string | null>(null)
  /** 拖动中图标的横向位移（正数向右），交给模板做 translateX */
  const dragDx = ref(0)

  let pressedId: string | null = null
  let startX = 0
  let moved = false

  function slots() {
    const root = unrefElement(listEl) as HTMLElement | undefined
    return Array.from(root?.children ?? []) as HTMLElement[]
  }

  function indexOf(id: string) {
    return slots().findIndex((el) => el.dataset.itemId === id)
  }

  function startItemDrag(id: string, event: PointerEvent) {
    if (event.button !== 0 || window.matchMedia('(max-width: 1000px)').matches) return
    pressedId = id
    startX = event.clientX
    moved = false
    dragDx.value = 0
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  }

  function moveItem(event: PointerEvent) {
    if (!pressedId) return
    const dx = event.clientX - startX
    /* 只认横向位移：竖向拖动永远不会开始排序 */
    if (!moved && Math.abs(dx) < DRAG_THRESHOLD) return
    moved = true
    draggingId.value = pressedId
    dragDx.value = Math.max(-MAX_SLIDE, Math.min(MAX_SLIDE, dx))

    /* 指针压到哪个按钮上，就吸附到那个槽位 */
    const target = slots().findIndex((el) => {
      const rect = el.getBoundingClientRect()
      return event.clientX >= rect.left && event.clientX <= rect.right
    })
    if (target >= 0 && target !== indexOf(pressedId)) {
      options.onMove(pressedId, target)
      /* 换位后位移归零，让图标回到槽位再从当前位置继续跟手 */
      startX = event.clientX
      dragDx.value = 0
    }
  }

  function endItemDrag(event: PointerEvent) {
    if (!pressedId) return
    const el = event.currentTarget as HTMLElement
    if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId)
    draggingId.value = null
    dragDx.value = 0
    pressedId = null
  }

  /** 拖动之后的那次 click 要吞掉，否则会顺手触发按钮本身 */
  function consumeClick() {
    if (!moved) return false
    moved = false
    return true
  }

  return { draggingId, dragDx, startItemDrag, moveItem, endItemDrag, consumeClick }
}
