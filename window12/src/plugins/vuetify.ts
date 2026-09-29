import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'

/**
 * Vuetify 主题必须显式声明，否则默认的 #1867C0 冷蓝会从各种默认态里漏出来。
 * 颜色取 docs/DESIGN-SYSTEM.md §1.4 的暖调色板，与 src/style.css 的令牌一一对应。
 */
export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          background: '#f9e4a5',
          surface: 'rgba(255, 250, 236, 0.55)',
          'on-surface': '#3d2b0e',
          primary: '#d99b1e',
          'on-primary': '#3d2b0e',
          secondary: '#8b6ad0',
          'on-secondary': '#ffffff',
          success: '#4e9a6a',
          'on-success': '#ffffff',
          warning: '#d99b1e',
          'on-warning': '#3d2b0e',
          error: '#d9564a',
          'on-error': '#ffffff',
          info: '#d99b1e',
          'on-info': '#3d2b0e',
        },
        variables: {
          'border-radius-root': '8px',
        },
      },
    },
  },
  defaults: {
    VProgressLinear: { rounded: true, height: 6 },
    VSlider: { color: 'primary', trackColor: 'rgba(74, 56, 20, 0.16)', trackFillColor: 'primary' },
    VSwitch: { color: 'primary', inset: true },
    VTextField: { variant: 'solo', flat: true, density: 'compact', hideDetails: true, bgColor: 'transparent' },
    VSnackbar: { rounded: 'lg' },
  },
})
