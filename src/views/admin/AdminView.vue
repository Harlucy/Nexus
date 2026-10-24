<template>
  <div class="admin-page">
    <header class="admin-header">
      <h1>后台管理</h1>
      <div>
        <el-button size="small" @click="$router.push('/')">返回首页</el-button>
        <el-button size="small" @click="$router.push('/short-links')">短链接管理</el-button>
      </div>
    </header>

    <section class="admin-section">
      <h2>节点集合</h2>
      <div v-for="(item, i) in config.nodeOptions" :key="'n'+i" class="link-item">
        <el-input v-model="item.text" placeholder="名称" />
        <el-input v-model="item.value" placeholder="链接" />
        <el-button type="danger" size="small" @click="config.nodeOptions.splice(i, 1)">删除</el-button>
      </div>
      <el-button size="small" type="primary" @click="config.nodeOptions.push({ value: '', text: '' })">添加节点</el-button>
    </section>

    <section class="admin-section">
      <h2>规则配置</h2>
      <div v-for="(item, i) in config.ruleOptions" :key="'r'+i" class="link-item">
        <el-input v-model="item.text" placeholder="名称" />
        <el-input v-model="item.value" placeholder="链接" />
        <el-button type="danger" size="small" @click="config.ruleOptions.splice(i, 1)">删除</el-button>
      </div>
      <el-button size="small" type="primary" @click="config.ruleOptions.push({ value: '', text: '' })">添加规则</el-button>
    </section>

    <section class="admin-section">
      <h2>YamlForge JS脚本</h2>
      <div v-for="(item, i) in config.yamlforgeScripts" :key="'s'+i" class="link-item">
        <el-input v-model="item.text" placeholder="名称" />
        <el-input v-model="item.value" placeholder="链接" />
        <el-button type="danger" size="small" @click="config.yamlforgeScripts.splice(i, 1)">删除</el-button>
      </div>
      <el-button size="small" type="primary" @click="config.yamlforgeScripts.push({ value: '', text: '' })">添加脚本</el-button>
    </section>

    <section class="admin-section">
      <h2>API配置</h2>
      <el-form label-width="140px">
        <el-form-item label="Subconverter API"><el-input v-model="config.apiUrl" /></el-form-item>
        <el-form-item label="YamlForge 后端"><el-input v-model="config.yamlforgeBackend" /></el-form-item>
        <el-form-item label="YamlForge API Key"><el-input v-model="config.yamlforgeApiKey" /></el-form-item>
        <el-form-item label="Shlink 后端"><el-input v-model="config.shlinkBackend" /></el-form-item>
        <el-form-item label="Shlink API Key"><el-input v-model="config.shlinkApiKey" /></el-form-item>
        <el-form-item label="Shlink 公开URL"><el-input v-model="config.shlinkPublicUrl" /></el-form-item>
      </el-form>
    </section>

    <div class="admin-actions">
      <el-button type="primary" :loading="saving" @click="saveConfig">保存配置</el-button>
      <el-button type="warning" @click="resetConfig">重置默认</el-button>
      <span v-if="msg" :class="msgOk ? 'text-success' : 'text-danger'">{{ msg }}</span>
    </div>
  </div>
</template>

<script>
import { apiRequest, showSuccess, showError } from '@/utils/api'

export default {
  name: 'AdminView',
  data() {
    return {
      config: {
        nodeOptions: [], ruleOptions: [], yamlforgeScripts: [],
        apiUrl: '', yamlforgeBackend: '', yamlforgeApiKey: '',
        shlinkBackend: '', shlinkApiKey: '', shlinkPublicUrl: '',
      },
      saving: false, msg: '', msgOk: false,
    }
  },
  created() { this.loadConfig() },
  methods: {
    async loadConfig() {
      try {
        const res = await apiRequest('get', '/config')
        if (res.success) this.config = res.data
      } catch (e) {
        showError('配置加载失败')
      }
    },
    async saveConfig() {
      this.saving = true; this.msg = ''
      try {
        const res = await apiRequest('post', '/config', this.config)
        this.msg = res.success ? '配置已保存' : '保存失败'
        this.msgOk = res.success
      } catch (e) {
        this.msg = '保存失败'; this.msgOk = false
      } finally {
        this.saving = false
      }
      setTimeout(() => { this.msg = '' }, 3000)
    },
    async resetConfig() {
      try {
        const res = await apiRequest('post', '/config/reset')
        if (res.success) { this.config = res.data; showSuccess('已重置为默认配置') }
      } catch (e) {
        showError('重置失败')
      }
    },
  },
}
</script>

<style scoped>
.admin-page { max-width: 1000px; margin: 0 auto; padding: 24px; }
.admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid var(--el-border-color); }
.admin-header h1 { margin: 0; font-size: 22px; }
.admin-section { margin-bottom: 24px; padding: 20px 0; border-bottom: 1px solid var(--el-border-color); }
.admin-section h2 { margin: 0 0 12px; font-size: 16px; }
.link-item { display: flex; gap: 10px; margin-bottom: 10px; }
.link-item .el-input:first-child { width: 180px; flex-shrink: 0; }
.link-item .el-input:nth-child(2) { flex: 1; }
.admin-actions { display: flex; align-items: center; gap: 10px; margin-top: 24px; padding-top: 20px; border-top: 2px solid var(--el-border-color); }
.text-success { color: var(--el-color-success); font-weight: 500; }
.text-danger { color: var(--el-color-danger); font-weight: 500; }
@media (max-width: 600px) {
  .admin-page { padding: 16px; }
  .admin-header { flex-wrap: wrap; gap: 12px; }
  .link-item { flex-wrap: wrap; }
  .link-item .el-input:first-child { width: 100%; }
  .link-item .el-input:nth-child(2) { min-width: 0; }
  .admin-actions { flex-wrap: wrap; }
}
</style>
