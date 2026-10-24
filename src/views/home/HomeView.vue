<template>
  <div class="home-page">
    <!-- Navbar -->
    <header class="navbar-header">
      <div class="navbar-inner">
        <router-link to="/" class="brand">{{ siteName }}</router-link>
        <nav>
          <router-link to="/short-links">短链接管理</router-link>
          <router-link :to="'/' + adminPath">配置</router-link>
          <a href="https://github.com/Harlucy/Nexus" target="_blank">GitHub</a>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <h1 class="page-title">Subconverter 订阅转换</h1>
      <SubTable />
    </main>

    <!-- Footer -->
    <footer class="page-footer">
      <span>GitHub: </span>
      <a href="https://github.com/stilleshan/subweb" target="_blank">stilleshan/subweb</a>
    </footer>
  </div>
</template>

<script>
import SubTable from './SubTable.vue'

export default {
  name: 'HomeView',
  components: { SubTable },
  data() {
    return { siteName: window.config?.siteName || 'Nexus', adminPath: window.config?.adminPath || 'admin' }
  },
}
</script>

<style scoped>
.home-page { min-height: 100vh; display: flex; flex-direction: column; background: var(--nexus-page-bg); }

.navbar-header { background: var(--el-bg-color); box-shadow: var(--nexus-header-shadow); position: sticky; top: 0; z-index: 100; }
.navbar-inner { max-width: 1200px; margin: 0 auto; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; }
.brand { font-size: 20px; font-weight: 700; color: var(--nexus-brand); text-decoration: none; }
nav a { color: var(--el-text-color-regular); text-decoration: none; margin-left: 20px; font-size: 14px; }
nav a:hover { color: var(--nexus-brand); }

.main-content { flex: 1; max-width: 900px; margin: 0 auto; padding: 40px 20px; width: 100%; box-sizing: border-box; }
.page-title { text-align: center; color: var(--nexus-brand); font-size: 28px; margin-bottom: 30px; }

.page-footer { text-align: center; padding: 16px; background: var(--nexus-footer-bg); color: var(--nexus-footer-text); font-size: 13px; }
.page-footer a { color: var(--nexus-footer-link); text-decoration: none; }
@media (max-width: 600px) {
  .navbar-inner { padding: 12px 16px; }
  nav { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px 12px; }
  nav a { margin-left: 0; }
}
</style>
