<template>
  <div class="auth-container">
    <div class="auth-box">
      <h2>🔐 两步验证</h2>
      <p class="subtitle">请输入验证器显示的6位验证码</p>
      <div class="input-row">
        <el-input
          v-model="token"
          placeholder="000000"
          maxlength="6"
          :disabled="loading"
          inputmode="numeric"
          autofocus
          @keyup.enter="login"
        />
        <el-button type="primary" :disabled="loading || token.length !== 6" @click="login">
          {{ loading ? '验证中...' : '验证' }}
        </el-button>
      </div>
      <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" style="margin-top:16px" />
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const API_BASE = window.config?.configServer
  ? `${window.config.configServer}/api`
  : '/api'

export default {
  name: 'AuthView',
  data() {
    return { token: '', loading: false, error: '' }
  },
  methods: {
    async login() {
      if (this.token.length !== 6) return
      this.loading = true
      this.error = ''
      try {
        const res = await axios.post(`${API_BASE}/auth/login`, { token: this.token })
        if (res.data.success) {
          sessionStorage.setItem('admin_token', res.data.token)
          this.$router.push('/')
        } else {
          this.error = res.data.message
          this.token = ''
        }
      } catch {
        this.error = '验证失败，请检查网络连接'
      }
      this.loading = false
    },
  },
}
</script>

<style scoped>
.auth-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; }
.auth-box { background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); width: 100%; max-width: 400px; text-align: center; }
.auth-box h2 { margin: 0 0 8px; }
.subtitle { color: #999; margin: 0 0 24px; font-size: 14px; }
.input-row { display: flex; gap: 10px; }
</style>
