<template>
  <div class="auth-container">
    <div class="auth-box">
      <h2>🔐 两步验证</h2>
      <p class="text-muted">请输入验证器显示的6位验证码</p>
      
      <div class="input-group">
        <input 
          v-model="inputToken" 
          type="text" 
          class="form-control form-control-lg text-center" 
          placeholder="000000"
          maxlength="6"
          @keyup.enter="login"
          :disabled="verifying"
          inputmode="numeric"
          pattern="[0-9]*"
          autofocus
        />
        <button 
          class="btn btn-primary" 
          @click="login"
          :disabled="verifying || inputToken.length !== 6"
        >
          {{ verifying ? '验证中...' : '验证' }}
        </button>
      </div>
      
      <div v-if="authError" class="alert alert-danger mt-3">
        {{ authError }}
      </div>
    </div>
  </div>
</template>

<script>
const API_BASE = (window.config && window.config.configServer) 
  ? window.config.configServer + '/api' 
  : window.location.origin + '/api';

export default {
  name: 'AuthView',
  data() {
    return {
      inputToken: '',
      verifying: false,
      authError: '',
    };
  },
  methods: {
    async login() {
      if (this.inputToken.length !== 6) return;
      
      this.verifying = true;
      this.authError = '';
      
      try {
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: this.inputToken })
        });
        const result = await response.json();
        
        if (result.success) {
          sessionStorage.setItem('admin_token', result.token);
          this.$router.push('/');
        } else {
          this.authError = result.message;
          this.inputToken = '';
        }
      } catch (e) {
        this.authError = '验证失败，请检查网络连接';
      }
      
      this.verifying = false;
    },
  },
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-box {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  width: 100%;
  max-width: 420px;
}

.auth-box h2 {
  text-align: center;
  margin-bottom: 10px;
}

.auth-box .text-muted {
  text-align: center;
  margin-bottom: 25px;
}
</style>
