<template>
  <div class="admin-container">
    <div class="admin-header">
      <h1>后台管理</h1>
      <div>
        <router-link to="/" class="btn btn-outline-secondary btn-sm">返回首页</router-link>
        <button @click="logout" class="btn btn-outline-danger btn-sm ms-2">退出</button>
      </div>
    </div>

    <div class="admin-section">
      <h2>节点集合</h2>
      <div class="link-list">
        <div v-for="(item, index) in config.nodeOptions" :key="'node-' + index" class="link-item">
          <input v-model="item.text" class="form-control form-control-sm" placeholder="名称" />
          <input v-model="item.value" class="form-control form-control-sm" placeholder="链接" />
          <button @click="removeItem('nodeOptions', index)" class="btn btn-danger btn-sm">删除</button>
        </div>
      </div>
      <button @click="addItem('nodeOptions')" class="btn btn-primary btn-sm mt-2">添加节点</button>
    </div>

    <div class="admin-section">
      <h2>规则配置</h2>
      <div class="link-list">
        <div v-for="(item, index) in config.ruleOptions" :key="'rule-' + index" class="link-item">
          <input v-model="item.text" class="form-control form-control-sm" placeholder="名称" />
          <input v-model="item.value" class="form-control form-control-sm" placeholder="链接" />
          <button @click="removeItem('ruleOptions', index)" class="btn btn-danger btn-sm">删除</button>
        </div>
      </div>
      <button @click="addItem('ruleOptions')" class="btn btn-primary btn-sm mt-2">添加规则</button>
    </div>

    <div class="admin-section">
      <h2>YamlForge JS脚本</h2>
      <div class="link-list">
        <div v-for="(item, index) in config.yamlforgeScripts" :key="'script-' + index" class="link-item">
          <input v-model="item.text" class="form-control form-control-sm" placeholder="名称" />
          <input v-model="item.value" class="form-control form-control-sm" placeholder="链接" />
          <button @click="removeItem('yamlforgeScripts', index)" class="btn btn-danger btn-sm">删除</button>
        </div>
      </div>
      <button @click="addItem('yamlforgeScripts')" class="btn btn-primary btn-sm mt-2">添加脚本</button>
    </div>

    <div class="admin-section">
      <h2>API配置</h2>
      <div class="config-form">
        <div class="mb-3">
          <label class="form-label">Subconverter API</label>
          <input v-model="config.apiUrl" class="form-control" />
        </div>
        <div class="mb-3">
          <label class="form-label">YamlForge 后端</label>
          <input v-model="config.yamlforgeBackend" class="form-control" />
        </div>
        <div class="mb-3">
          <label class="form-label">YamlForge API Key</label>
          <input v-model="config.yamlforgeApiKey" class="form-control" />
        </div>
        <div class="mb-3">
          <label class="form-label">Shlink 后端</label>
          <input v-model="config.shlinkBackend" class="form-control" />
        </div>
        <div class="mb-3">
          <label class="form-label">Shlink API Key</label>
          <input v-model="config.shlinkApiKey" class="form-control" />
        </div>
        <div class="mb-3">
          <label class="form-label">Shlink 公开URL</label>
          <input v-model="config.shlinkPublicUrl" class="form-control" />
        </div>
      </div>
    </div>

    <div class="admin-actions">
      <button @click="saveConfig" class="btn btn-success" :disabled="saving">
        {{ saving ? '保存中...' : '保存配置' }}
      </button>
      <button @click="resetConfig" class="btn btn-warning">重置默认</button>
      <span v-if="saveMessage" class="save-message" :class="saveSuccess ? 'text-success' : 'text-danger'">
        {{ saveMessage }}
      </span>
    </div>
  </div>
</template>

<script>
const API_BASE = (window.config && window.config.configServer) 
  ? window.config.configServer + '/api' 
  : window.location.origin + '/api';

export default {
  name: 'AdminView',
  data() {
    return {
      config: {
        nodeOptions: [],
        ruleOptions: [],
        yamlforgeScripts: [],
        apiUrl: '',
        yamlforgeBackend: '',
        yamlforgeApiKey: '',
        shlinkBackend: '',
        shlinkApiKey: '',
        shlinkPublicUrl: '',
      },
      saving: false,
      saveMessage: '',
      saveSuccess: false,
    };
  },
  created() {
    this.loadConfig();
  },
  methods: {
    logout() {
      sessionStorage.removeItem('admin_token');
      this.$router.push('/login');
    },
    
    getToken() {
      return sessionStorage.getItem('admin_token');
    },
    
    async loadConfig() {
      try {
        const response = await fetch(`${API_BASE}/config`, {
          headers: { 'Authorization': `Bearer ${this.getToken()}` }
        });
        
        if (response.status === 401) {
          this.logout();
          return;
        }
        
        const result = await response.json();
        if (result.success) {
          this.config = result.data;
        }
      } catch (e) {
        console.error('Failed to load config:', e);
      }
    },
    
    async saveConfig() {
      this.saving = true;
      this.saveMessage = '';
      
      try {
        const response = await fetch(`${API_BASE}/config`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getToken()}`
          },
          body: JSON.stringify(this.config),
        });
        
        if (response.status === 401) {
          this.logout();
          return;
        }
        
        const result = await response.json();
        this.saveMessage = result.success ? '配置已保存' : '保存失败';
        this.saveSuccess = result.success;
      } catch (e) {
        this.saveMessage = '保存失败';
        this.saveSuccess = false;
      }
      
      this.saving = false;
      setTimeout(() => { this.saveMessage = ''; }, 3000);
    },
    
    async resetConfig() {
      if (!confirm('确定要重置为默认配置吗？')) return;
      
      try {
        const response = await fetch(`${API_BASE}/config/reset`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.getToken()}` }
        });
        
        if (response.status === 401) {
          this.logout();
          return;
        }
        
        const result = await response.json();
        if (result.success) {
          this.config = result.data;
          this.saveMessage = '已重置为默认配置';
          this.saveSuccess = true;
        }
      } catch (e) {
        this.saveMessage = '重置失败';
      }
      
      setTimeout(() => { this.saveMessage = ''; }, 3000);
    },
    
    addItem(listName) {
      this.config[listName].push({ value: '', text: '' });
    },
    removeItem(listName, index) {
      this.config[listName].splice(index, 1);
    },
  },
};
</script>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid #eee;
}

.admin-section {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.admin-section h2 {
  margin-bottom: 15px;
  font-size: 18px;
  color: #333;
}

.link-item {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.link-item input:first-child {
  width: 200px;
}

.link-item input:nth-child(2) {
  flex: 1;
}

.config-form {
  max-width: 600px;
}

.admin-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #eee;
}

.save-message {
  margin-left: 10px;
  font-weight: 500;
}
</style>
