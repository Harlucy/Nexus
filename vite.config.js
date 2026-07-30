import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
      'assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      'components': fileURLToPath(new URL('./src/components', import.meta.url)),
      'network': fileURLToPath(new URL('./src/network', import.meta.url)),
      'views': fileURLToPath(new URL('./src/views', import.meta.url)),
      'utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
    },
  },
  server: {
    port: 8080,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
