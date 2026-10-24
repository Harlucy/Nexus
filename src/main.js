import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './assets/theme.css'
import App from './App.vue'
import router from './router'

const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
function syncTheme({ matches }) {
  document.documentElement.classList.toggle('dark', matches)
}
syncTheme(systemTheme)
systemTheme.addEventListener('change', syncTheme)

const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.mount('#app')
