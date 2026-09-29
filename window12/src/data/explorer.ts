import type { FileEntry, PlaceEntry } from '../types/desktop'

/** 资源管理器左侧的位置 */
export const places: PlaceEntry[] = [
  { label: '主页', icon: 'mdi-home-outline' },
  { label: '桌面', icon: 'mdi-monitor-dashboard' },
  { label: '下载', icon: 'mdi-download-outline' },
  { label: '文档', icon: 'mdi-file-document-outline' },
  { label: '图片', icon: 'mdi-image-multiple-outline' },
  { label: '音乐', icon: 'mdi-music-note-outline' },
]

/** 文件资源管理器与搜索共用同一份文件清单 */
export const files: FileEntry[] = [
  { name: '季度汇报.pptx', meta: '演示文稿 · 4.2 MB', icon: 'mdi-file-powerpoint-outline' },
  { name: '品牌规范.fig', meta: '设计文件 · 18.6 MB', icon: 'mdi-vector-polygon' },
  { name: '首页原型.png', meta: '图片 · 2.1 MB', icon: 'mdi-image-outline' },
  { name: '会议记录.docx', meta: '文档 · 128 KB', icon: 'mdi-file-document-outline' },
  { name: '预算表.xlsx', meta: '表格 · 76 KB', icon: 'mdi-table-large' },
  { name: '落地页文案.md', meta: '文本 · 8 KB', icon: 'mdi-language-markdown-outline' },
]
