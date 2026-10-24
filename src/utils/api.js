import axios from 'axios'
import { ElMessage } from 'element-plus'

// The frontend and config server share one local origin.
const API_BASE = window.config?.configServer
  ? `${window.config.configServer}/api`
  : '/api'

export async function apiRequest(method, path, data = null) {
  const headers = { 'Content-Type': 'application/json' }
  const request = { method, url: `${API_BASE}${path}`, headers, timeout: 25000 }
  if (data !== null && data !== undefined) request.data = data
  const res = await axios(request)
  return res.data
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
