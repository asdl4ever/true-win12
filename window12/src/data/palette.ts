/**
 * 暖调强调色板（docs/DESIGN-SYSTEM.md §1.4）。
 * 与 src/style.css 的 :root 默认值一一对应，是强调色的唯一来源。
 * contrast 是"纯色底上的文字色"，随 accent 成对下发，避免出现白字压浅底。
 */
export type AccentPreset = {
  name: string
  value: string
  deep: string
  contrast: string
}

export const accents: AccentPreset[] = [
  { name: '蜂蜜', value: '#d99b1e', deep: '#b87f12', contrast: '#3d2b0e' },
  { name: '蜜桃', value: '#e4703c', deep: '#c55626', contrast: '#3d2b0e' },
  { name: '莓果', value: '#d24a6e', deep: '#b03356', contrast: '#ffffff' },
  { name: '抹茶', value: '#5f9e58', deep: '#487e42', contrast: '#ffffff' },
  { name: '紫薯', value: '#8b6ad0', deep: '#7251b8', contrast: '#ffffff' },
]

export const defaultAccent = accents[0]

/** 按色值找预设；找不到就退回默认，保证 accent 三件套永远成套 */
export function accentOf(value: string): AccentPreset {
  return accents.find((item) => item.value === value) ?? defaultAccent
}
