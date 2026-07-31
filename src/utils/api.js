import axios from 'axios'
import { ElMessage } from 'element-plus'

// 如果配置了 configServer 就用它，否则用当前域名（通过 Nginx 反代）
const API_BASE = window.config?.configServer
  ? `${window.config.configServer}/api`
  : '/api'

export function getToken() {
  return sessionStorage.getItem('admin_token')
}

export function clearToken() {
  sessionStorage.removeItem('admin_token')
}

export function isLoggedIn() {
  return !!getToken()
}

export async function apiRequest(method, path, data = null) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const res = await axios({ method, url: `${API_BASE}${path}`, headers, data, timeout: 10000 })
    return res.data
  } catch (e) {
    if (e.response?.status === 401) {
      clearToken()
      window.location.href = '/login'
    }
    throw e
  }
}

export function showError(msg) {
  ElMessage.error(msg)
}

export function showSuccess(msg) {
  ElMessage.success(msg)
}

export function showWarning(msg) {
  ElMessage.warning(msg)
}
