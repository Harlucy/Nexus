import { createRouter, createWebHistory } from 'vue-router';

// 从 config 获取后台路径
const getAdminPath = () => {
  return (window.config && window.config.adminPath) || 'admin';
};

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
    path: `/${getAdminPath()}`,
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
    next('/login');
  } else if (to.path === '/login' && token) {
    next('/');
  } else {
    next();
  }
});

export default router;
