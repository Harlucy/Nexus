<template>
  <div class="links-page">
    <header class="links-header">
      <div class="heading"><router-link to="/" class="brand">Nexus</router-link><h1>短链接管理</h1></div>
      <nav><router-link to="/">订阅转换</router-link><router-link :to="'/' + adminPath">配置</router-link></nav>
    </header>

    <form class="toolbar" @submit.prevent="search">
      <el-input v-model="searchTerm" placeholder="搜索短链接、目标地址或标签" clearable :prefix-icon="Search" aria-label="搜索短链接" />
      <el-button type="primary" :icon="Search" native-type="submit">搜索</el-button>
      <el-tooltip content="刷新列表"><el-button :icon="Refresh" :loading="loading" aria-label="刷新列表" @click="loadLinks" /></el-tooltip>
    </form>

    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon class="error" />
    <el-table v-loading="loading" :data="links" empty-text="暂无短链接" row-key="shortCode" class="links-table">
      <el-table-column label="短链接" min-width="210">
        <template #default="{ row }">
          <div class="short-link"><span>{{ row.shortUrl }}</span>
            <el-tooltip content="复制短链接"><el-button :icon="CopyDocument" text aria-label="复制短链接" @click="copyLink(row.shortUrl)" /></el-tooltip>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="longUrl" label="目标地址" min-width="300" show-overflow-tooltip />
      <el-table-column label="标签" min-width="140"><template #default="{ row }">{{ (row.tags || []).join(', ') || '—' }}</template></el-table-column>
      <el-table-column label="访问次数" width="100"><template #default="{ row }">{{ row.visitsSummary?.total ?? row.visitsCount ?? 0 }}</template></el-table-column>
      <el-table-column label="操作" width="128" fixed="right">
        <template #default="{ row }">
          <el-tooltip content="编辑目标地址"><el-button :icon="Edit" :disabled="Boolean(deleting)" aria-label="编辑目标地址" @click="editLink(row)" /></el-tooltip>
          <el-tooltip content="删除短链接"><el-button :icon="Delete" type="danger" plain :loading="deleting === row.shortCode" :disabled="Boolean(deleting)" aria-label="删除短链接" @click="deleteLink(row)" /></el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <span>共 {{ total }} 条</span>
      <el-pagination v-model:current-page="page" :page-size="20" :total="total" layout="prev, pager, next" @current-change="loadLinks" />
    </div>

    <el-dialog v-model="editing" title="编辑短链接" width="640px" :close-on-click-modal="false" :close-on-press-escape="!saving" :show-close="!saving">
      <el-form label-position="top" @submit.prevent="saveLink">
        <el-form-item label="短链接"><el-input :model-value="selected?.shortUrl" readonly aria-label="短链接" /></el-form-item>
        <el-form-item label="目标地址" required><el-input v-model="longUrl" type="textarea" :rows="5" aria-label="目标地址" /></el-form-item>
        <el-form-item label="标签"><el-input v-model="tags" placeholder="多个标签用逗号分隔" aria-label="标签" /></el-form-item>
      </el-form>
      <el-alert v-if="saveError" :title="saveError" type="error" :closable="false" show-icon />
      <template #footer><el-button :disabled="saving" @click="editing = false">取消</el-button><el-button type="primary" :loading="saving" @click="saveLink">保存到服务器</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Search, Refresh, Edit, Delete, CopyDocument } from '@element-plus/icons-vue'
import { apiRequest, showSuccess, showError } from '@/utils/api'

const adminPath = window.config?.adminPath || 'admin'
const links = ref([])
const page = ref(1)
const total = ref(0)
const searchTerm = ref('')
const loading = ref(false)
const error = ref('')
const editing = ref(false)
const selected = ref(null)
const longUrl = ref('')
const tags = ref('')
const saving = ref(false)
const saveError = ref('')
const deleting = ref('')
let requestId = 0

function errorMessage(e) {
  return e.response?.data?.detail || e.response?.data?.message || '请求失败，请检查 Shlink 服务和 API Key'
}

async function loadLinks() {
  const current = ++requestId
  loading.value = true
  error.value = ''
  try {
    const query = new URLSearchParams({ page: String(page.value), itemsPerPage: '20', searchTerm: searchTerm.value })
    const data = await apiRequest('get', `/shlink/short-urls?${query}`)
    if (current !== requestId) return
    links.value = data.shortUrls.data
    total.value = data.shortUrls.pagination.totalItems
  } catch (e) {
    if (current === requestId) { links.value = []; total.value = 0; error.value = errorMessage(e) }
  } finally {
    if (current === requestId) loading.value = false
  }
}

function search() {
  page.value = 1
  loadLinks()
}

function editLink(link) {
  selected.value = link
  longUrl.value = link.longUrl
  tags.value = (link.tags || []).join(', ')
  saveError.value = ''
  editing.value = true
}

async function saveLink() {
  if (saving.value) return
  try {
    const url = new URL(longUrl.value.trim())
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
  } catch {
    saveError.value = '请输入完整的 http 或 https 目标地址'
    return
  }
  saving.value = true
  saveError.value = ''
  try {
    const domain = selected.value.domain
    const query = domain ? `?${new URLSearchParams({ domain })}` : ''
    await apiRequest('patch', `/shlink/short-urls/${encodeURIComponent(selected.value.shortCode)}${query}`, {
      longUrl: longUrl.value.trim(),
      tags: [...new Set(tags.value.split(/[,，]/).map(tag => tag.trim()).filter(Boolean))]
    })
    editing.value = false
    showSuccess('已保存到服务器')
    await loadLinks()
  } catch (e) {
    saveError.value = errorMessage(e)
  } finally {
    saving.value = false
  }
}

async function deleteLink(link) {
  if (deleting.value) return
  try {
    await ElMessageBox.confirm(
      `确定删除短链接“${link.shortUrl}”吗？删除后无法恢复。`,
      '删除短链接',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  deleting.value = link.shortCode
  try {
    const query = link.domain ? `?${new URLSearchParams({ domain: link.domain })}` : ''
    await apiRequest('delete', `/shlink/short-urls/${encodeURIComponent(link.shortCode)}${query}`)
    if (links.value.length === 1 && page.value > 1) page.value -= 1
    showSuccess('短链接已删除')
    await loadLinks()
  } catch (e) {
    showError(errorMessage(e))
  } finally {
    deleting.value = ''
  }
}

async function copyLink(link) {
  try { await navigator.clipboard.writeText(link); showSuccess('短链接已复制') }
  catch { showError('复制失败') }
}

onMounted(loadLinks)
</script>

<style scoped>
.links-page { max-width: 1200px; margin: 0 auto; padding: 24px; color: var(--el-text-color-primary); }
.links-header { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--el-border-color); }
.heading { display: flex; align-items: center; gap: 20px; }
.brand { color: var(--nexus-brand); text-decoration: none; font-weight: 700; font-size: 20px; }
h1 { font-size: 22px; margin: 0; }
nav { display: flex; gap: 20px; }
nav a { color: var(--el-text-color-regular); font-size: 14px; text-decoration: none; }
nav a:hover { color: var(--nexus-brand); }
.toolbar { display: flex; gap: 12px; margin: 24px 0; }
.toolbar .el-input { max-width: 480px; }
.toolbar .el-button + .el-button { margin-left: 0; }
.error { margin-bottom: 16px; }
.links-table { width: 100%; min-height: 200px; }
.short-link { display: flex; align-items: center; gap: 4px; }
.short-link span { min-width: 0; overflow-wrap: anywhere; }
.short-link .el-button { flex-shrink: 0; }
.pagination { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; font-size: 14px; color: var(--el-text-color-regular); }
:deep(.el-dialog) { max-width: calc(100vw - 32px); }
@media (max-width: 600px) {
  .links-page { padding: 16px; }
  .links-header { flex-wrap: wrap; }
  .heading { flex-wrap: wrap; gap: 12px; }
  .toolbar { flex-wrap: wrap; }
  .toolbar .el-input { width: 100%; max-width: none; }
  .pagination { flex-wrap: wrap; gap: 12px; }
}
</style>
