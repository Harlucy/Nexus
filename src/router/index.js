import { createRouter, createWebHistory } from 'vue-router'
import { isLoggedIn } from '@/utils/api'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/AuthView.vue'),
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/home/HomeView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/:adminPath',
    name: 'admin',
    component: () => import('@/views/admin/AdminView.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  const adminPath = window.config?.adminPath || 'admin'

  if (to.path === '/login') {
    next(isLoggedIn() ? '/' : undefined)
    return
  }

  if (to.meta.requiresAuth && !isLoggedIn()) {
    next('/login')
    return
  }

  if (to.name === 'admin' && to.params.adminPath !== adminPath) {
    next('/')
    return
  }

  next()
})

export default router
