<template>
  <div class="sub-card">
    <el-form label-position="top">
      <!-- 节点集合 -->
      <el-form-item label="节点集合">
        <el-select v-model="selectedNode" style="width: 100%">
          <el-option v-for="o in nodeOptions" :key="o.value" :value="o.value" :label="o.text" />
        </el-select>
      </el-form-item>

      <!-- 规则配置 -->
      <el-form-item label="规则配置">
        <el-select v-model="selectedRule" style="width: 100%">
          <el-option v-for="o in ruleOptions" :key="o.value" :value="o.value" :label="o.text" />
        </el-select>
      </el-form-item>

      <!-- 客户端 -->
      <el-form-item label="客户端">
        <el-select v-model="target" style="width: 100%">
          <el-option v-for="o in targetOptions" :key="o.value" :value="o.value" :label="o.text" />
        </el-select>
      </el-form-item>

      <!-- 转换参数 -->
      <el-form-item label="转换参数">
        <div class="checkbox-grid">
          <el-checkbox v-model="convertParams.new_name">新组名称</el-checkbox>
          <el-checkbox v-model="convertParams.classic">经典规则</el-checkbox>
          <el-checkbox v-model="convertParams.expand">展开规则</el-checkbox>
          <el-checkbox v-model="convertParams.emoji">Emoji</el-checkbox>
          <el-checkbox v-model="convertParams.add_emoji">添加Emoji</el-checkbox>
          <el-checkbox v-model="convertParams.remove_emoji">移除Emoji</el-checkbox>
        </div>
      </el-form-item>

      <!-- YamlForge -->
      <el-form-item>
        <el-switch v-model="yamlforge.enabled" active-text="YamlForge 高级处理/合并" />
      </el-form-item>

      <template v-if="yamlforge.enabled">
        <el-form-item label="JS 脚本选择">
          <el-select v-model="yamlforge.selectedScript" style="width: 100%" placeholder="请选择 JS 脚本">
            <el-option value="" label="请选择 JS 脚本" />
            <el-option v-for="o in yamlforge.scriptOptions" :key="o.value" :value="o.value" :label="o.text" />
          </el-select>
        </el-form-item>
        <el-form-item label="输出文件名（可选）">
          <el-input v-model="yamlforge.filename" placeholder="例如：UPCMYMOBILE.yaml" />
        </el-form-item>
      </template>

      <el-divider />

      <!-- 生成订阅链接 -->
      <el-form-item>
        <div class="result-row">
          <el-input v-model="result.subUrl" placeholder="点击转换生成订阅链接" readonly />
          <el-button type="primary" @click="getSubUrl">转换</el-button>
        </div>
      </el-form-item>

      <!-- 生成短链接 -->
      <el-form-item>
        <div class="result-row">
          <el-input v-model="result.shortUrl" placeholder="点击生成 Shlink 短链接" readonly />
          <el-button type="success" @click="generateShlinkUrl">生成短链</el-button>
        </div>
      </el-form-item>

      <el-form-item label="自定义短链接后缀（Slug，可选）">
        <el-input v-model="shlink.customSlug" placeholder="例如：KsUPe 或 UPCM_YMOBILE" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import axios from 'axios'
import { showSuccess, showWarning, showError } from '@/utils/api'
import { ElLoading } from 'element-plus'

export default {
  name: 'SubTable',
  data() {
    return {
      nodeOptions: [
        { value: 'https://gist.githubusercontent.com/Harlucy/94137d4de17bcdd8c6015e7dba8eec01/raw/ClashSelf', text: 'ClashSelf - 节点集合' },
      ],
      selectedNode: 'https://gist.githubusercontent.com/Harlucy/94137d4de17bcdd8c6015e7dba8eec01/raw/ClashSelf',
      ruleOptions: [
        { value: 'https://raw.githubusercontent.com/Harlucy/howmagicrule/refs/heads/main/clash-rule.ini', text: '黑名单模式' },
        { value: 'https://raw.githubusercontent.com/Harlucy/howmagicrule/refs/heads/main/clash-rule-manual.ini', text: '黑名单手动模式' },
        { value: 'https://raw.githubusercontent.com/Harlucy/howmagicrule/refs/heads/main/clash-rule-black.ini', text: '白名单模式' },
        { value: 'https://raw.githubusercontent.com/Harlucy/howmagicrule/refs/heads/main/clash-rule-black-manual.ini', text: '白名单手动模式' },
      ],
      selectedRule: 'https://raw.githubusercontent.com/Harlucy/howmagicrule/refs/heads/main/clash-rule.ini',
      targetOptions: [
        { value: 'clash', text: 'Clash' },
        { value: 'clashr', text: 'ClashR' },
        { value: 'v2ray', text: 'V2Ray' },
        { value: 'quanx', text: 'Quantumult X' },
        { value: 'surge&ver=4', text: 'SurgeV4' },
        { value: 'singbox', text: 'Sing-box' },
      ],
      target: 'clashr',
      convertParams: { new_name: true, classic: true, expand: true, emoji: true, add_emoji: false, remove_emoji: false },
      yamlforge: {
        enabled: false,
        selectedScript: '',
        filename: '',
        scriptOptions: [
          { value: 'https://gist.githubusercontent.com/Harlucy/47ef7ea44e01c80fe6b1364e545ebf14/raw/MYUSE.js', text: 'MYUSE - 自用' },
          { value: 'https://gist.githubusercontent.com/Harlucy/47ef7ea44e01c80fe6b1364e545ebf14/raw/MOBILE.js', text: 'MOBILE - 手机自用' },
          { value: 'https://gist.githubusercontent.com/Harlucy/47ef7ea44e01c80fe6b1364e545ebf14/raw/SOCIALUSE.js', text: 'SOCIALUSE - 普通共享使用' },
          { value: 'https://gist.githubusercontent.com/Harlucy/47ef7ea44e01c80fe6b1364e545ebf14/raw/ROUTER.js', text: 'ROUTER - 路由自用' },
        ],
      },
      shlink: { customSlug: '' },
      result: { subUrl: '', shortUrl: '' },
    }
  },
  created() {
    this.loadAdminConfig()
  },
  methods: {
    async loadAdminConfig() {
      try {
        const token = sessionStorage.getItem('admin_token')
        if (!token) return
        const cfg = window.config?.configServer || window.location.origin
        const res = await axios.get(`${cfg}/api/config`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.data?.success && res.data.data) {
          const d = res.data.data
          if (d.nodeOptions?.length) this.nodeOptions = d.nodeOptions
          if (d.ruleOptions?.length) this.ruleOptions = d.ruleOptions
          if (d.yamlforgeScripts?.length) this.yamlforge.scriptOptions = d.yamlforgeScripts
          this.selectedNode = this.nodeOptions[0]?.value || ''
          this.selectedRule = this.ruleOptions[0]?.value || ''
        }
      } catch (e) { /* ignore */ }
    },

    toCopy(text, title) {
      if (!text) { showWarning('内容为空，复制失败'); return }
      navigator.clipboard?.writeText(text).then(
        () => showSuccess(`${title} 复制成功`),
        () => {
          // fallback
          const el = document.createElement('textarea')
          el.value = text
          document.body.appendChild(el)
          el.select()
          try {
            document.execCommand('copy')
            showSuccess(`${title} 复制成功`)
          } catch { showWarning('复制失败，请手动复制') }
          document.body.removeChild(el)
        }
      )
    },

    buildSubconverterUrl() {
      const api = window.config?.apiUrl || 'http://localhost:25500'
      let url = `${api}/sub?target=${this.target}&url=${encodeURIComponent(this.selectedNode)}&config=${encodeURIComponent(this.selectedRule)}`
      if (this.convertParams.new_name) url += '&new_name=true'
      if (this.convertParams.classic) url += '&classic=true'
      if (this.convertParams.expand) url += '&expand=true'
      if (this.convertParams.emoji) url += '&emoji=true'
      if (this.convertParams.add_emoji) url += '&add_emoji=true'
      if (this.convertParams.remove_emoji) url += '&remove_emoji=true'
      return url
    },

    buildYamlForgeUrl(subUrl) {
      if (!this.yamlforge.enabled || !this.yamlforge.selectedScript) return subUrl
      const backend = window.config?.yamlforge?.backend
      const apiKey = window.config?.yamlforge?.apiKey || ''
      if (!backend) { showWarning('请配置 YamlForge 后端地址'); return null }
      let url = `${backend}/yamlprocess?api_key=${apiKey}&source=${encodeURIComponent(subUrl)}&merge=${encodeURIComponent(this.yamlforge.selectedScript)}`
      if (this.yamlforge.filename) url += `&filename=${encodeURIComponent(this.yamlforge.filename)}`
      return url
    },

    getSubUrl() {
      const subUrl = this.buildSubconverterUrl()
      this.result.subUrl = this.yamlforge.enabled ? (this.buildYamlForgeUrl(subUrl) || '') : subUrl
      if (this.result.subUrl) this.toCopy(this.result.subUrl, '订阅链接')
    },

    async generateShlinkUrl() {
      const subUrl = this.buildSubconverterUrl()
      const finalUrl = this.yamlforge.enabled ? this.buildYamlForgeUrl(subUrl) : subUrl
      if (!finalUrl) return

      const backend = window.config?.shlink?.backend
      const apiKey = window.config?.shlink?.apiKey
      if (!backend || !apiKey) { showWarning('请配置 Shlink 后端地址和 API Key'); return }

      const loading = ElLoading.service({ fullscreen: true })
      try {
        const res = await axios.post(`${backend}/rest/v3/short-urls`, {
          longUrl: finalUrl,
          customSlug: this.shlink.customSlug || undefined,
          tags: ['Subscription'],
        }, { headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' } })

        if (res.data?.shortUrl) {
          const publicUrl = window.config?.shlink?.publicUrl || ''
          const code = res.data.shortUrl.split('/').pop()
          this.result.shortUrl = publicUrl ? `${publicUrl}/${code}` : res.data.shortUrl
          this.toCopy(this.result.shortUrl, 'Shlink 短链接')
        } else {
          showError('Shlink 短链接生成失败，请检查配置')
        }
      } catch {
        showError('Shlink 短链接生成失败，请检查 Shlink 服务是否可用')
      } finally {
        loading.close()
      }
    },
  },
}
</script>

<style scoped>
.sub-card { background: #fff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
.checkbox-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 16px; }
.result-row { display: flex; gap: 10px; width: 100%; }
.result-row .el-input { flex: 1; }
@media (max-width: 600px) {
  .checkbox-grid { grid-template-columns: repeat(2, 1fr); }
  .result-row { flex-direction: column; }
}
</style>
