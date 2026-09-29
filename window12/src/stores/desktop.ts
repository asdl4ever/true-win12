import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { accounts } from '../data/accounts'
import { apps, taskbarItems } from '../data/apps'
import { games } from '../data/games'
import { accents, defaultAccent, accentOf } from '../data/palette'
import type {
  Account,
  AppEntry,
  PanelId,
  Position,
  PowerState,
  WindowSize,
} from '../types/desktop'

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

  /* 开机进桌面时不预开任何窗口，全部由用户点开 */
  const panels = ref<Record<PanelId, boolean>>({
    explorer: false,
    settings: false,
    store: false,
    arcade: false,
    music: false,
  })
  /* null 表示还停在样式表给的初始位置 */
  const positions = ref<Record<PanelId, Position | null>>({
    explorer: null,
    settings: null,
    store: null,
    arcade: null,
    music: null,
  })
  const zIndexes = ref<Record<PanelId, number>>({
    explorer: 10,
    settings: 12,
    store: 13,
    arcade: 14,
    music: 11,
  })
  let topZ = 15

  /* 收到桌面右侧的窗口：窗口保持挂载（游戏进度不丢），只是不可见 */
  const docked = ref<Record<PanelId, boolean>>({
    explorer: false,
    settings: false,
    store: false,
    arcade: false,
    music: false,
  })

  /** 正在运行的应用 = 开着窗口的应用，也是任务视图里的大卡片 */
  const openPanels = computed(() =>
    (Object.keys(panels.value) as PanelId[]).filter((id) => panels.value[id]),
  )

  /** 右侧图标栏里排队的窗口 */
  const dockedPanels = computed(() =>
    (Object.keys(docked.value) as PanelId[]).filter((id) => docked.value[id] && panels.value[id]),
  )

  /** 层级最高的那个就是当前窗口 */
  const frontPanel = computed(() =>
    [...openPanels.value].sort((a, b) => zIndexes.value[b] - zIndexes.value[a])[0],
  )

  function openPanel(id: PanelId) {
    panels.value[id] = true
    docked.value[id] = false
  }

  /** 收到桌面右侧的小图标栏 */
  function dockPanel(id: PanelId) {
    if (!panels.value[id]) return
    docked.value[id] = true
    accountBarOpen.value = false
  }

  /** 从小图标栏呼出 */
  function restorePanel(id: PanelId) {
    if (!panels.value[id]) {
      openPanel(id)
      return
    }
    docked.value[id] = false
    accountBarOpen.value = false
    taskViewOpen.value = false
    raise(id)
  }

  /** 任务栏图标：没开就打开，收起了就呼出，开着就收到右侧 */
  function toggleDock(id: PanelId) {
    if (!panels.value[id]) {
      openPanel(id)
      raise(id)
      return
    }
    if (docked.value[id]) {
      restorePanel(id)
      return
    }
    dockPanel(id)
  }

  /** 点击时置顶，避免各窗口用样式里的固定层级互相压住 */
  function raise(id: PanelId) {
    zIndexes.value[id] = ++topZ
  }

  /** 位置以桌面左上角为原点，并约束在桌面范围内，防止卡片被拖出视野 */
  function placeWindow(id: PanelId, x: number, y: number, size: WindowSize, area: WindowSize) {
    positions.value[id] = {
      x: clamp(x, 0, Math.max(0, area.width - size.width)),
      y: clamp(y, 0, Math.max(0, area.height - size.height)),
    }
  }

  /* -------------------------------- 外观设置 ------------------------------- */

  /* 外观设置的初值必须与 src/style.css 的 :root 一致，
     否则内联的 tokens 会永久覆盖样式表，设置面板显示的数字也就成了假的 */
  const accent = ref(defaultAccent.value)
  const accentDeep = ref(defaultAccent.deep)
  const accentContrast = ref(defaultAccent.contrast)
  const blur = ref(28)
  const radius = ref(26)
  const effects = ref(true)
  const specular = ref(true)

  /** 果冻强度：1 标准 / 0.5 轻柔 / 0 关闭 */
  const jelly = ref(1)

  const JELLY_CURVES: Record<string, string> = {
    '1': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    '0.5': 'cubic-bezier(0.3, 1.2, 0.6, 1)',
    '0': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  }

  /** 强调色三件套成套下发，避免出现白字压浅底这类不成套的组合 */
  function applyAccent(value: string) {
    const preset = accentOf(value)
    accent.value = preset.value
    accentDeep.value = preset.deep
    accentContrast.value = preset.contrast
  }

  /** 设置面板改的就是这几个变量，卡片通过 CSS 变量整体响应 */
  const tokens = computed(() => ({
    '--accent': accent.value,
    '--accent-deep': accentDeep.value,
    '--accent-contrast': accentContrast.value,
    '--blur': `${effects.value ? blur.value : 0}px`,
    '--radius': `${radius.value}px`,
    '--spring-jelly': JELLY_CURVES[String(jelly.value)],
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
  /* 任务栏的账号/电源态：点 Win 时任务栏内容整体换成头像与关机 */
  const accountBarOpen = ref(false)

  /* 机器上的账号列表与当前登录账号：任务栏切换面板与商店共用 */
  const accountList = ref<Account[]>([...accounts])
  const user = ref(accountList.value[0])

  function switchUser(account: Account) {
    if (account.id === user.value.id) {
      notify(`${account.name} 已经在用了`)
      return
    }
    user.value = account
    /* 每个账号有自己的一套外观，切换后整桌主题跟着换 */
    applyAccent(account.accent)
    notify(`已切换到 ${account.name} 的桌面`)
  }

  /* 新增账号：按输入的名字建一个，并立刻切过去 */
  let newUserSeq = 0
  function addUser(name: string) {
    newUserSeq += 1
    const account: Account = {
      id: `user-${Date.now()}`,
      name,
      initial: name.slice(0, 1),
      role: '标准用户',
      accent: accents[newUserSeq % accents.length].value,
      avatar: `https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(name)}`,
    }
    accountList.value = [...accountList.value, account]
    user.value = account
    applyAccent(account.accent)
    notify(`已新增账号 ${account.name}`)
  }

  /* 删除账号：至少留一个；删掉的正好是当前账号时，自动切到剩下的第一个 */
  function removeUser(id: string) {
    if (accountList.value.length <= 1) {
      notify('至少要保留一个账号')
      return
    }
    const target = accountList.value.find((item) => item.id === id)
    if (!target) return
    accountList.value = accountList.value.filter((item) => item.id !== id)
    if (user.value.id === id) {
      const next = accountList.value[0]
      user.value = next
      applyAccent(next.accent)
    }
    notify(`已删除账号 ${target.name}`)
  }

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

  /* -------------------------------- 开关机 -------------------------------- */

  const power = ref<PowerState>('boot')
  let powerTimer: number | undefined

  function schedulePower(next: PowerState, delay: number) {
    window.clearTimeout(powerTimer)
    powerTimer = window.setTimeout(() => {
      power.value = next
    }, delay)
  }

  /** 按下电源键：先放开机动画，再进桌面 */
  function powerOn() {
    accountBarOpen.value = false
    taskViewOpen.value = false
    power.value = 'boot'
    schedulePower('on', 2600)
  }

  /** 关机：先播关机动画，再停在已关机画面 */
  function powerOff() {
    if (power.value !== 'on') return
    accountBarOpen.value = false
    taskViewOpen.value = false
    power.value = 'shutdown'
    schedulePower('off', 1800)
  }

  /* 打开页面先走一遍开机流程 */
  schedulePower('on', 2600)

  /* -------------------------------- 任务视图 ------------------------------- */

  const taskViewOpen = ref(false)

  function openTaskView() {
    taskViewOpen.value = true
    accountBarOpen.value = false
    searchOpen.value = false
    selectedIcon.value = null
  }

  function closeTaskView() {
    taskViewOpen.value = false
  }

  function toggleTaskView() {
    taskViewOpen.value ? closeTaskView() : openTaskView()
  }

  /* -------------------------------- 任务栏顺序 ------------------------------ */

  /* 任务栏应用按钮的顺序：拖到哪个位置就吸附到哪 */
  const taskbarOrder = ref<string[]>(taskbarItems.map((item) => item.id))

  function moveTaskbarItem(id: string, index: number) {
    const from = taskbarOrder.value.indexOf(id)
    if (from < 0) return
    const to = Math.min(Math.max(index, 0), taskbarOrder.value.length - 1)
    if (from === to) return
    taskbarOrder.value.splice(from, 1)
    taskbarOrder.value.splice(to, 0, id)
  }

  /* -------------------------------- 搜索面板 ------------------------------- */

  const searchOpen = ref(false)

  function openSearch() {
    accountBarOpen.value = false
    taskViewOpen.value = false
    searchOpen.value = true
  }

  function closeSearch() {
    searchOpen.value = false
  }

  return {
    panels,
    positions,
    zIndexes,
    docked,
    openPanels,
    dockedPanels,
    frontPanel,
    openPanel,
    dockPanel,
    restorePanel,
    toggleDock,
    raise,
    placeWindow,
    accent,
    accents,
    accentDeep,
    accentContrast,
    applyAccent,
    blur,
    radius,
    effects,
    specular,
    jelly,
    tokens,
    message,
    toasting,
    notify,
    selectedIcon,
    accountBarOpen,
    user,
    accountList,
    switchUser,
    addUser,
    removeUser,
    installedGames,
    installing,
    activeGame,
    launchableApps,
    installGame,
    uninstallGame,
    playGame,
    power,
    powerOn,
    powerOff,
    taskViewOpen,
    openTaskView,
    closeTaskView,
    toggleTaskView,
    searchOpen,
    openSearch,
    closeSearch,
    taskbarOrder,
    moveTaskbarItem,
  }
})
