import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

export type PanelId = 'explorer' | 'settings' | 'widget' | 'store' | 'arcade'

export const PANEL_LABEL: Record<PanelId, string> = {
  explorer: '文件资源管理器',
  settings: '设置 · 个性化',
  widget: '小组件',
  store: '应用商店',
  arcade: '游戏',
}

export const PANEL_ICON: Record<PanelId, string> = {
  explorer: 'mdi-folder-outline',
  settings: 'mdi-cog-outline',
  widget: 'mdi-view-dashboard-outline',
  store: 'mdi-storefront-outline',
  arcade: 'mdi-gamepad-variant-outline',
}

export type GameEntry = {
  id: string
  name: string
  icon: string
  category: string
  size: string
  rating: number
  developer: string
  desc: string
}

/* 商店里的游戏目录：都是经典玩法，源码就在 components/games 下 */
export const games: GameEntry[] = [
  {
    id: 'snake',
    name: '贪吃蛇',
    icon: 'mdi-snake',
    category: '街机',
    size: '1.2 MB',
    rating: 4.7,
    developer: 'Window 12 实验室',
    desc: '方向键控制，吃到果实变长，别撞墙也别咬到自己。',
  },
  {
    id: 'whack',
    name: '打地鼠',
    icon: 'mdi-hammer',
    category: '休闲',
    size: '0.8 MB',
    rating: 4.5,
    developer: 'Window 12 实验室',
    desc: '30 秒内敲中尽可能多的地鼠，手越快它冒头越快。',
  },
  {
    id: '2048',
    name: '2048',
    icon: 'mdi-grid',
    category: '益智',
    size: '1.0 MB',
    rating: 4.8,
    developer: 'Window 12 实验室',
    desc: '方向键合并相同数字，一路凑到 2048。',
  },
]

export type AppEntry = {
  id: string
  label: string
  icon: string
  /* 有 panel 的才会真的开出一个窗口 */
  panel: PanelId | null
  /* 安装了才出现的游戏入口 */
  game?: string
}

/* 开始菜单与任务视图共用同一份应用清单 */
export const apps: AppEntry[] = [
  { id: 'explorer', label: '文件资源管理器', icon: 'mdi-folder-outline', panel: 'explorer' },
  { id: 'store', label: '应用商店', icon: 'mdi-storefront-outline', panel: 'store' },
  { id: 'settings', label: '设置', icon: 'mdi-cog-outline', panel: 'settings' },
  { id: 'widget', label: '小组件', icon: 'mdi-view-dashboard-outline', panel: 'widget' },
  { id: 'terminal', label: '终端', icon: 'mdi-console', panel: null },
  { id: 'music', label: '音乐', icon: 'mdi-music', panel: null },
  { id: 'photos', label: '照片', icon: 'mdi-image-outline', panel: null },
]

type Position = { x: number; y: number }
type Size = { width: number; height: number }

const INSTALL_KEY = 'window12.installedGames'

function readInstalled(): string[] {
  try {
    const raw = window.localStorage.getItem(INSTALL_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((id) => games.some((game) => game.id === id)) : []
  } catch {
    return []
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/**
 * 桌面状态：窗口（开关 / 位置 / 层级）、外观令牌、消息提示、图标选中、开始菜单、
 * 任务视图，以及应用商店里的游戏安装状态。
 * 指针事件与尺寸测量留在组件里，store 只保存数据与规则。
 */
export const useDesktopStore = defineStore('desktop', () => {
  /* --------------------------------- 窗口 --------------------------------- */

  const panels = ref<Record<PanelId, boolean>>({
    explorer: true,
    settings: true,
    widget: true,
    store: false,
    arcade: false,
  })
  /* null 表示还停在样式表给的初始位置 */
  const positions = ref<Record<PanelId, Position | null>>({
    explorer: null,
    settings: null,
    widget: null,
    store: null,
    arcade: null,
  })
  const zIndexes = ref<Record<PanelId, number>>({
    explorer: 10,
    settings: 12,
    widget: 11,
    store: 13,
    arcade: 14,
  })
  let topZ = 15

  /** 正在运行的应用 = 开着窗口的应用，也是任务视图里的大卡片 */
  const openPanels = computed(() =>
    (Object.keys(panels.value) as PanelId[]).filter((id) => panels.value[id]),
  )

  /** 层级最高的那个就是当前窗口 */
  const frontPanel = computed(() =>
    [...openPanels.value].sort((a, b) => zIndexes.value[b] - zIndexes.value[a])[0],
  )

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

  /* -------------------------------- 应用商店 ------------------------------- */

  const installedGames = ref<string[]>(readInstalled())
  /* 游戏 id -> 下载进度百分比 */
  const installing = ref<Record<string, number>>({})
  const activeGame = ref<string | null>(null)
  const installTimers = new Map<string, number>()

  /* 装好的游戏也会出现在开始菜单与任务视图里 */
  const launchableApps = computed<AppEntry[]>(() => [
    ...apps,
    ...installedGames.value.flatMap((id) => {
      const game = games.find((item) => item.id === id)
      return game
        ? [{ id: `game-${game.id}`, label: game.name, icon: game.icon, panel: 'arcade' as PanelId, game: game.id }]
        : []
    }),
  ])

  function installGame(id: string) {
    if (installedGames.value.includes(id) || installing.value[id] !== undefined) return
    const game = games.find((item) => item.id === id)
    installing.value[id] = 6

    const timer = window.setInterval(() => {
      const next = (installing.value[id] ?? 0) + 9
      if (next < 100) {
        installing.value[id] = next
        return
      }
      window.clearInterval(timer)
      installTimers.delete(id)
      delete installing.value[id]
      installedGames.value = [...installedGames.value, id]
      notify(`${game?.name ?? '应用'} 安装完成`)
    }, 150)

    installTimers.set(id, timer)
  }

  function uninstallGame(id: string) {
    const game = games.find((item) => item.id === id)
    window.clearInterval(installTimers.get(id))
    installTimers.delete(id)
    delete installing.value[id]
    installedGames.value = installedGames.value.filter((item) => item !== id)
    if (activeGame.value === id) activeGame.value = null
    notify(`${game?.name ?? '应用'} 已卸载`)
  }

  function playGame(id: string) {
    activeGame.value = id
    openPanel('arcade')
    raise('arcade')
  }

  /* 安装记录写进 localStorage，刷新后仍在 */
  watch(installedGames, (value) => {
    try {
      window.localStorage.setItem(INSTALL_KEY, JSON.stringify(value))
    } catch {
      /* 隐私模式下写不进去就算了 */
    }
  })

  /* -------------------------------- 任务视图 ------------------------------- */

  const taskViewOpen = ref(false)

  function openTaskView() {
    taskViewOpen.value = true
    startOpen.value = false
    selectedIcon.value = null
  }

  function closeTaskView() {
    taskViewOpen.value = false
  }

  function toggleTaskView() {
    taskViewOpen.value ? closeTaskView() : openTaskView()
  }

  return {
    panels,
    positions,
    zIndexes,
    openPanels,
    frontPanel,
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
    installedGames,
    installing,
    activeGame,
    launchableApps,
    installGame,
    uninstallGame,
    playGame,
    taskViewOpen,
    openTaskView,
    closeTaskView,
    toggleTaskView,
  }
})
