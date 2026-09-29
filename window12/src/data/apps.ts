import type { AppEntry, PanelId, TaskbarItem } from '../types/desktop'

/** 窗口标题 */
export const PANEL_LABEL: Record<PanelId, string> = {
  explorer: '文件资源管理器',
  settings: '设置 · 个性化',
  store: '应用商店',
  arcade: '游戏',
  music: '音乐',
}

export const PANEL_ICON: Record<PanelId, string> = {
  explorer: 'mdi-folder-outline',
  settings: 'mdi-cog-outline',
  store: 'mdi-storefront-outline',
  arcade: 'mdi-gamepad-variant-outline',
  music: 'mdi-music',
}

/** 任务栏、任务视图与搜索共用同一份应用清单 */
export const apps: AppEntry[] = [
  { id: 'explorer', label: '文件资源管理器', icon: 'mdi-folder-outline', panel: 'explorer' },
  { id: 'store', label: '应用商店', icon: 'mdi-storefront-outline', panel: 'store' },
  { id: 'music', label: '音乐', icon: 'mdi-music', panel: 'music' },
  { id: 'settings', label: '设置', icon: 'mdi-cog-outline', panel: 'settings' },
  { id: 'terminal', label: '终端', icon: 'mdi-console', panel: null },
  { id: 'photos', label: '照片', icon: 'mdi-image-outline', panel: null },
]

/** 任务栏里可拖动的应用按钮（Win 与搜索固定在左侧，不参与排序） */
export const taskbarItems: TaskbarItem[] = [
  { id: 'explorer', label: '文件资源管理器', icon: 'mdi-folder-outline', panel: 'explorer' },
  { id: 'store', label: '应用商店', icon: 'mdi-storefront-outline', panel: 'store' },
  { id: 'music', label: '音乐', icon: 'mdi-music', panel: 'music' },
  { id: 'terminal', label: '终端', icon: 'mdi-console', panel: null },
  { id: 'settings', label: '设置', icon: 'mdi-cog-outline', panel: 'settings' },
]

/** 桌面上的图标，双击打开 */
export const desktopIcons: AppEntry[] = [
  { id: 'pc', label: '此电脑', icon: 'mdi-monitor', panel: 'explorer' },
  { id: 'projects', label: '项目', icon: 'mdi-folder-outline', panel: 'explorer' },
  { id: 'store', label: '应用商店', icon: 'mdi-storefront-outline', panel: 'store' },
  { id: 'terminal', label: '终端', icon: 'mdi-console', panel: null },
  { id: 'trash', label: '回收站', icon: 'mdi-trash-can-outline', panel: null },
  { id: 'settings', label: '设置', icon: 'mdi-cog-outline', panel: 'settings' },
]
