import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    redirect: '/',
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/home/HomeView.vue'),
  },
  {
    path: '/short-links',
    name: 'short-links',
    component: () => import('@/views/short-links/ShortLinksView.vue'),
  },
  {
    path: '/:adminPath',
    name: 'admin',
    component: () => import('@/views/admin/AdminView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  const adminPath = window.config?.adminPath || 'admin'

  if (to.name === 'admin' && to.params.adminPath !== adminPath) {
    next('/')
    return
  }

  next()
})

export default router
