import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vuetify from 'vite-plugin-vuetify'

// 部署平台（Railway 等）会用外部域名访问，需要显式放行，否则 Vite 会返回 "Blocked request"
const deployHosts = ['true-win12-production.up.railway.app', '.up.railway.app']

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true })],
  server: {
    allowedHosts: deployHosts,
  },
  preview: {
    allowedHosts: deployHosts,
    // 部署平台通过 PORT 注入端口，未注入时用 Vite 默认的 4173
    port: Number(process.env.PORT) || 4173,
  },
})
