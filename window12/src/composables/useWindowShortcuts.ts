import { useEventListener } from '@vueuse/core'
import { useDesktopStore } from '../stores/desktop'

/**
 * 全局键盘路径。
 *
 * 组合键的选择受浏览器限制：Alt+Tab 归操作系统、Ctrl+Tab 归标签页、
 * Ctrl+W / Ctrl+Shift+W 归浏览器窗口，三组都到不了页面。
 * 因此只保留下面这几条，全部确认在 Chrome / Edge / Firefox / Safari 里未被占用。
 * 一律用 event.code 而不是 event.key —— 后者随键盘布局变化。
 */

/** 在输入控件里打字时不抢快捷键 */
function typing(target: EventTarget | null) {
  const el = target as HTMLElement | null
  if (!el) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
}

export function useWindowShortcuts() {
  const desktop = useDesktopStore()

  useEventListener(window, 'keydown', (event: KeyboardEvent) => {
    const mod = event.ctrlKey || event.metaKey
    if (!mod || event.altKey) return

    /* Ctrl+K：搜索开关（业界惯例）。放在输入框判断之前——
       在搜索框里按 Ctrl+K 也应该能收起来 */
    if (event.code === 'KeyK' && !event.shiftKey) {
      event.preventDefault()
      desktop.searchOpen ? desktop.closeSearch() : desktop.openSearch()
      return
    }

    if (typing(event.target)) return

    switch (event.code) {
      /* Ctrl+` / Ctrl+Shift+`：在打开的窗口间前向 / 反向轮转 */
      case 'Backquote':
        event.preventDefault()
        desktop.cyclePanel(event.shiftKey ? -1 : 1)
        return

      /* Ctrl+Shift+E：任务视图 */
      case 'KeyE':
        if (!event.shiftKey) return
        event.preventDefault()
        desktop.toggleTaskView()
        return

      default:
    }
  })
}
