/**
 * 桌面各模块共享的类型。
 * 这里只有类型，没有实现，也不依赖任何运行时代码。
 */

/** 可以被打开成窗口的应用 */
export type PanelId = 'explorer' | 'settings' | 'store' | 'arcade' | 'music'

export type PowerState = 'boot' | 'on' | 'shutdown' | 'off'

/** 开始菜单 / 任务视图 / 搜索共用的应用条目 */
export type AppEntry = {
  id: string
  label: string
  icon: string
  /** 有 panel 的才会真的开出一个窗口 */
  panel: PanelId | null
  /** 安装了才出现的游戏入口 */
  game?: string
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

export type FileEntry = {
  name: string
  meta: string
  icon: string
}

export type Account = {
  id: string
  name: string
  initial: string
  role: string
  /** 每个账号一套强调色，切换时整桌主题跟着换 */
  accent: string
  avatar: string
}

/** 桌面上的图标 */
export type DesktopIcon = AppEntry

/** 资源管理器左侧的位置 */
export type PlaceEntry = {
  label: string
  icon: string
}

/** 任务栏上的应用按钮，可拖动排序 */
export type TaskbarItem = {
  id: string
  label: string
  icon: string
  panel: PanelId | null
}

/** 伪音乐软件里的一首歌 */
export type Track = {
  id: string
  title: string
  artist: string
  album: string
  /** 时长（秒），只用于展示与进度换算 */
  duration: number
  icon: string
}

export type Position = {
  x: number
  y: number
}

export type WindowSize = {
  width: number
  height: number
}
