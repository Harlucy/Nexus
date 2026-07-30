import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/login',
    component: () => import('@/views/auth/AuthView.vue'),
    name: 'login',
  },
  {
    path: '/',
    component: () => import('@/layouts/main/MainLayout.vue'),
    name: 'LayoutView',
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@/views/home/HomeView.vue'),
        name: 'home',
      },
    ],
  },
  {
    path: '/wl9w5sv019c98n9t',
    component: () => import('@/views/admin/AdminView.vue'),
    name: 'admin',
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem('admin_token');
  
  if (to.meta.requiresAuth && !token) {
    // 未认证，跳转到登录页
    next('/login');
  } else if (to.path === '/login' && token) {
    // 已认证，跳转到主页
    next('/');
  } else {
    next();
  }
});

export default router;
