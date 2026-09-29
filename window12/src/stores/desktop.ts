import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type PanelId = 'explorer' | 'settings' | 'widget'

export const PANEL_LABEL: Record<PanelId, string> = {
  explorer: '文件资源管理器',
  settings: '设置 · 个性化',
  widget: '小组件',
}

type Position = { x: number; y: number }
type Size = { width: number; height: number }

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/**
 * 桌面状态：窗口（开关 / 位置 / 层级）、外观令牌、消息提示、图标选中与开始菜单。
 * 指针事件与尺寸测量留在组件里，store 只保存数据与规则。
 */
export const useDesktopStore = defineStore('desktop', () => {
  /* --------------------------------- 窗口 --------------------------------- */

  const panels = ref<Record<PanelId, boolean>>({ explorer: true, settings: true, widget: true })
  /* null 表示还停在样式表给的初始位置 */
  const positions = ref<Record<PanelId, Position | null>>({
    explorer: null,
    settings: null,
    widget: null,
  })
  const zIndexes = ref<Record<PanelId, number>>({ explorer: 10, settings: 12, widget: 11 })
  let topZ = 13

  function openPanel(id: PanelId) {
    panels.value[id] = true
  }

  function togglePanel(id: PanelId) {
    panels.value[id] = !panels.value[id]
  }

  /** 点击时置顶，避免各窗口用样式里的固定层级互相压住 */
  function raise(id: PanelId) {
    zIndexes.value[id] = ++topZ
  }

  /** 位置以桌面左上角为原点，并约束在桌面范围内，防止卡片被拖出视野 */
  function placeWindow(id: PanelId, x: number, y: number, size: Size, area: Size) {
    positions.value[id] = {
      x: clamp(x, 0, Math.max(0, area.width - size.width)),
      y: clamp(y, 0, Math.max(0, area.height - size.height)),
    }
  }

  /* -------------------------------- 外观设置 ------------------------------- */

  const accent = ref('#6d4ab8')
  const accents = [
    { name: '紫罗兰', value: '#6d4ab8' },
    { name: '蜂蜜', value: '#a86a10' },
    { name: '抹茶', value: '#4f7a44' },
    { name: '莓果', value: '#a83a68' },
  ]
  const blur = ref(24)
  const radius = ref(20)
  const effects = ref(true)

  /** 设置面板改的就是这三个变量，卡片通过 CSS 变量整体响应 */
  const tokens = computed(() => ({
    '--accent': accent.value,
    '--blur': `${effects.value ? blur.value : 0}px`,
    '--radius': `${radius.value}px`,
  }))

  /* -------------------------------- 消息提示 ------------------------------- */

  const message = ref('')
  const toasting = ref(false)

  function notify(text: string) {
    message.value = text
    toasting.value = true
  }

  /* ---------------------------- 桌面图标与开始菜单 --------------------------- */

  const selectedIcon = ref<string | null>(null)
  const startOpen = ref(false)

  return {
    panels,
    positions,
    zIndexes,
    openPanel,
    togglePanel,
    raise,
    placeWindow,
    accent,
    accents,
    blur,
    radius,
    effects,
    tokens,
    message,
    toasting,
    notify,
    selectedIcon,
    startOpen,
  }
})
