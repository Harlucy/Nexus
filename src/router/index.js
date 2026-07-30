import { createRouter, createWebHistory } from 'vue-router';

// 登录页路由
const loginRoute = {
  path: '/login',
  component: () => import('@/views/auth/AuthView.vue'),
  name: 'login',
};

// 主页路由
const homeRoute = {
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
};

// 后台管理路由（动态路径）
const adminRoute = {
  path: '/:adminPath',
  component: () => import('@/views/admin/AdminView.vue'),
  name: 'admin',
  meta: { requiresAuth: true },
};

const routes = [loginRoute, homeRoute, adminRoute];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem('admin_token');
  const adminPath = (window.config && window.config.adminPath) || 'admin';
  
  // 登录页
  if (to.path === '/login') {
    if (token) {
      next('/'); // 已登录，跳转主页
    } else {
      next(); // 未登录，显示登录页
    }
    return;
  }
  
  // 需要认证的页面
  if (!token) {
    next('/login');
    return;
  }
  
  // 后台管理页 - 验证路径是否正确
  if (to.name === 'admin' && to.params.adminPath !== adminPath) {
    next('/'); // 路径不匹配，跳转主页
    return;
  }
  
  next();
});

export default router;
