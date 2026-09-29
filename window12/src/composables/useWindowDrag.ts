import { storeToRefs } from 'pinia'
import { ref, type Ref } from 'vue'
import { PANEL_LABEL } from '../data/apps'
import { useDesktopStore } from '../stores/desktop'
import type { PanelId } from '../types/desktop'

type DragState = {
  panel: PanelId
  pointerX: number
  pointerY: number
  originX: number
  originY: number
  el: HTMLElement
}

/**
 * 窗口拖拽：拖标题栏移动、按下置顶、边界约束、方向键移动。
 * 位置规则在 store 里，这里只负责量尺寸与指针事件，不碰业务状态。
 * 舞台元素由使用方提供（模板 ref），便于量出可用区域。
 */
export function useWindowDrag(stageEl: Ref<HTMLElement | null>) {
  const desktop = useDesktopStore()
  const { positions, zIndexes, docked } = storeToRefs(desktop)
  const { raise, placeWindow: clampPlacement } = desktop

  const dragging = ref<PanelId | null>(null)
  let dragState: DragState | null = null

  function placeWindow(panel: PanelId, x: number, y: number, el?: HTMLElement) {
    clampPlacement(
      panel,
      x,
      y,
      { width: el?.offsetWidth ?? 0, height: el?.offsetHeight ?? 0 },
      { width: stageEl.value?.clientWidth ?? 0, height: stageEl.value?.clientHeight ?? 0 },
    )
  }

  function startDrag(panel: PanelId, event: PointerEvent) {
    const target = event.target as HTMLElement
    if (event.button !== 0 || target.closest('button') || !target.closest('.win-bar')) return
    if (window.matchMedia('(max-width: 1000px)').matches) return

    const el = event.currentTarget as HTMLElement
    const from = positions.value[panel] ?? { x: el.offsetLeft, y: el.offsetTop }
    positions.value[panel] = from
    dragState = {
      panel,
      pointerX: event.clientX,
      pointerY: event.clientY,
      originX: from.x,
      originY: from.y,
      el,
    }
    dragging.value = panel
    raise(panel)
    el.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  function moveDrag(event: PointerEvent) {
    if (!dragState) return
    placeWindow(
      dragState.panel,
      dragState.originX + event.clientX - dragState.pointerX,
      dragState.originY + event.clientY - dragState.pointerY,
      dragState.el,
    )
  }

  function endDrag(event: PointerEvent) {
    if (!dragState) return
    if (dragState.el.hasPointerCapture(event.pointerId)) {
      dragState.el.releasePointerCapture(event.pointerId)
    }
    dragState = null
    dragging.value = null
  }

  function moveWindow(panel: PanelId, event: KeyboardEvent) {
    const step = event.shiftKey ? 64 : 24
    const steps: Record<string, [number, number] | undefined> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }
    const delta = steps[event.key]
    if (!delta) return

    const el = event.currentTarget as HTMLElement
    const from = positions.value[panel] ?? { x: el.offsetLeft, y: el.offsetTop }
    placeWindow(panel, from.x + delta[0], from.y + delta[1], el)
    raise(panel)
    event.preventDefault()
  }

  /** 挂到窗口外壳上的绑定：定位、层级、指针与键盘事件 */
  function winBindings(panel: PanelId) {
    const pos = positions.value[panel]
    return {
      class: { dragging: dragging.value === panel, docked: docked.value[panel] },
      style: {
        left: pos ? `${pos.x}px` : undefined,
        top: pos ? `${pos.y}px` : undefined,
        zIndex: zIndexes.value[panel],
      },
      tabindex: 0,
      role: 'group',
      'aria-label': `窗口 ${PANEL_LABEL[panel]}：拖动标题栏或按方向键移动，按住 Shift 加速`,
      onPointerdown: (event: PointerEvent) => startDrag(panel, event),
      onPointermove: moveDrag,
      onPointerup: endDrag,
      onPointercancel: endDrag,
      onKeydown: (event: KeyboardEvent) => moveWindow(panel, event),
    }
  }

  return { dragging, winBindings }
}
