<template>
  <div class="home-page">
    <!-- Navbar -->
    <header class="navbar-header">
      <div class="navbar-inner">
        <router-link to="/" class="brand">{{ siteName }}</router-link>
        <nav>
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
    return { siteName: window.config?.siteName || 'Nexus' }
  },
}
</script>

<style>
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
</style>

<style scoped>
.home-page { min-height: 100vh; display: flex; flex-direction: column; background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%); }

.navbar-header { background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.08); position: sticky; top: 0; z-index: 100; }
.navbar-inner { max-width: 1200px; margin: 0 auto; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; }
.brand { font-size: 20px; font-weight: 700; color: #7367F0; text-decoration: none; }
nav a { color: #555; text-decoration: none; margin-left: 20px; font-size: 14px; }
nav a:hover { color: #7367F0; }

.main-content { flex: 1; max-width: 900px; margin: 0 auto; padding: 40px 20px; width: 100%; }
.page-title { text-align: center; color: #7367F0; font-size: 28px; margin-bottom: 30px; }

.page-footer { text-align: center; padding: 16px; background: #2f3542; color: #aaa; font-size: 13px; }
.page-footer a { color: #7367F0; text-decoration: none; }
</style>
