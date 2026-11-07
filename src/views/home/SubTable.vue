<template>
  <div class="sub-card">
    <el-form label-position="top">
      <!-- 节点集合：可多选，选中项与下方追加链接一起交给 Subconverter 合并 -->
      <el-form-item label="节点集合（可多选，选中项会合并）">
        <el-select v-model="selectedNodes" multiple collapse-tags collapse-tags-tooltip style="width: 100%">
          <el-option v-for="o in nodeOptions" :key="o.value" :value="o.value" :label="o.text" />
        </el-select>
      </el-form-item>

      <!-- 追加订阅链接：每行一个，与上方选择合并 -->
      <el-form-item label="追加订阅链接（每行一个，与上方选择合并）">
        <el-input
          v-model="extraSources"
          type="textarea"
          :rows="3"
          placeholder="https://example.com/sub-a&#10;https://example.com/sub-b" />
        <div v-if="sources.length > 1" class="merge-hint">将合并 {{ sources.length }} 个订阅源</div>
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

      <!-- 规则模式：expand=true 内联规则，省略则由 rule-providers 承载 -->
      <el-form-item label="规则模式">
        <el-radio-group v-model="ruleMode">
          <el-radio-button value="provider">RuleProvider（约 70 KB）</el-radio-button>
          <el-radio-button value="inline">内联规则（约 1 MB）</el-radio-button>
        </el-radio-group>
        <div class="merge-hint">
          <template v-if="ruleMode === 'provider'">规则集走 rule-providers，客户端按 interval 缓存更新，订阅本身很小</template>
          <template v-else>所有规则写进配置，兼容性最好，但每次订阅更新都要重传约 1 MB</template>
        </div>
      </el-form-item>

      <!-- 转换参数：布尔项按 subconverter 文档的默认/推荐值预勾选 -->
      <el-form-item label="转换参数">
        <div class="checkbox-grid">
          <el-checkbox v-for="p in booleanParams" :key="p.key" v-model="convertParams[p.key]">
            <span :title="`${p.key}：${p.note}`">{{ p.label }}</span>
          </el-checkbox>
        </div>
        <div class="merge-hint">默认值与 subconverter 文档一致；悬浮可看参数名与说明</div>
      </el-form-item>

      <!-- 高级字符串参数：留空不写进链接 -->
      <el-collapse v-model="advancedOpen" class="advanced">
        <el-collapse-item name="adv" title="高级参数（字符串 / 正则 / 脚本，留空即不传）">
          <el-form-item v-for="p in textParams" :key="p.key" :label="p.label">
            <el-input v-model="convertText[p.key]" :placeholder="p.placeholder" clearable />
          </el-form-item>
        </el-collapse-item>
      </el-collapse>

      <!-- YamlForge -->
      <el-form-item>
        <el-switch v-model="yamlforge.enabled" active-text="YamlForge 高级处理/合并" aria-label="YamlForge 高级处理/合并" />
      </el-form-item>
      <template v-if="yamlforge.enabled">
        <el-form-item label="JS 脚本选择">
          <el-select v-model="yamlforge.selectedScript" style="width: 100%" placeholder="请选择 JS 脚本" aria-label="JS 脚本选择">
            <el-option v-for="o in yamlforge.scriptOptions" :key="o.value" :value="o.value" :label="o.text" />
          </el-select>
        </el-form-item>
      </template>
      <el-form-item label="输出文件名（可选）">
        <el-input v-model="yamlforge.filename" :placeholder="filenamePlaceholder" aria-label="输出文件名" />
      </el-form-item>

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
import { apiRequest, showSuccess, showWarning, showError } from '@/utils/api'
import {
  collectSources,
  buildSubconverterUrl as buildSubUrl,
  ruleModeParams,
  sourceLabel,
  mergedPrefix,
  BOOLEAN_PARAMS,
  TEXT_PARAMS,
  defaultBooleanParams,
  defaultTextParams,
} from '@/utils/subUrl'
import { ElLoading } from 'element-plus'

export default {
  name: 'SubTable',
  data() {
    return {
      nodeOptions: [
        { value: 'https://gist.githubusercontent.com/Harlucy/94137d4de17bcdd8c6015e7dba8eec01/raw/ClashSelf', text: 'ClashSelf - 节点集合' },
      ],
      selectedNodes: ['https://gist.githubusercontent.com/Harlucy/94137d4de17bcdd8c6015e7dba8eec01/raw/ClashSelf'],
      extraSources: '',
      ruleOptions: [
        { value: 'https://raw.githubusercontent.com/Harlucy/howmagicrule/refs/heads/main/clash-rule.ini', text: '白名单模式（漏网走代理）' },
        { value: 'https://raw.githubusercontent.com/Harlucy/howmagicrule/refs/heads/main/clash-rule-manual.ini', text: '白名单手动模式（漏网走代理）' },
        { value: 'https://raw.githubusercontent.com/Harlucy/howmagicrule/refs/heads/main/clash-rule-black.ini', text: '黑名单模式（漏网走直连）' },
        { value: 'https://raw.githubusercontent.com/Harlucy/howmagicrule/refs/heads/main/clash-rule-black-manual.ini', text: '黑名单手动模式（漏网走直连）' },
        { value: 'https://raw.githubusercontent.com/Harlucy/howmagicrule/refs/heads/main/clash-rule-ad.ini', text: '白名单 + 广告拦截（补充规则）' },
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
      ruleMode: 'provider',
      booleanParams: BOOLEAN_PARAMS,
      textParams: TEXT_PARAMS,
      advancedOpen: [],
      convertParams: defaultBooleanParams(),
      convertText: defaultTextParams(),
      yamlforge: {
        enabled: true,
        selectedScript: '',
        filename: '',
        scriptOptions: [
          { value: 'https://gist.githubusercontent.com/Harlucy/47ef7ea44e01c80fe6b1364e545ebf14/raw/MYUSE.js', text: 'MYUSE - 自用' },
          { value: 'https://gist.githubusercontent.com/Harlucy/47ef7ea44e01c80fe6b1364e545ebf14/raw/MOBILE.js', text: 'MOBILE - 手机自用' },
          { value: 'https://gist.githubusercontent.com/Harlucy/47ef7ea44e01c80fe6b1364e545ebf14/raw/SOCIALUSE.js', text: 'SOCIALUSE - 普通共享使用' },
          { value: 'https://gist.githubusercontent.com/Harlucy/47ef7ea44e01c80fe6b1364e545ebf14/raw/SOCIALMOBILE.js', text: 'SOCIALMOBILE - 手机共享使用' },
          { value: 'https://gist.githubusercontent.com/Harlucy/47ef7ea44e01c80fe6b1364e545ebf14/raw/ROUTER.js', text: 'ROUTER - 路由自用' },
          { value: 'https://gist.githubusercontent.com/Harlucy/47ef7ea44e01c80fe6b1364e545ebf14/raw/SchoolUSE.js', text: 'SchoolUSE - 校园使用' },
        ],
      },
      shlink: { customSlug: '' },
      result: { subUrl: '', shortUrl: '' },
    }
  },
  computed: {
    sources() {
      return collectSources(this.selectedNodes, this.extraSources)
    },
    filenamePlaceholder() {
      return this.defaultOutputFilename()
    },
  },
  created() {
    this.loadAdminConfig()
  },
  methods: {
    async loadAdminConfig() {
      try {
        const res = await apiRequest('get', '/config')
        if (res.success && res.data) {
          const d = res.data
          if (Array.isArray(d.nodeOptions)) this.nodeOptions = d.nodeOptions
          if (Array.isArray(d.ruleOptions)) this.ruleOptions = d.ruleOptions
          if (Array.isArray(d.yamlforgeScripts)) this.yamlforge.scriptOptions = d.yamlforgeScripts
          window.config.apiUrl = d.apiUrl
          window.config.yamlforge = { backend: d.yamlforgeBackend, apiKey: d.yamlforgeApiKey }
          window.config.shlink = { backend: d.shlinkBackend, apiKey: d.shlinkApiKey, publicUrl: d.shlinkPublicUrl }
          this.selectedNodes = this.nodeOptions[0]?.value ? [this.nodeOptions[0].value] : []
          this.selectedRule = this.ruleOptions[0]?.value || ''
          this.yamlforge.selectedScript = this.yamlforge.scriptOptions[0]?.value || ''
        }
      } catch (e) { showError('配置加载失败，请检查本地服务') }
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

    sourceLabelOf(value) {
      const known = this.nodeOptions.find(o => o.value === value)?.text
      let label = known
      if (!label) {
        try { label = new URL(value).hostname } catch { label = '' }
      }
      return String(label || '').split(' - ')[0].trim()
    },

    buildSubconverterUrl() {
      if (this.sources.length === 0 || !this.selectedRule) {
        showWarning('请选择节点集合和规则配置')
        return ''
      }
      return buildSubUrl({
        api: window.config?.apiUrl || 'http://localhost:25500',
        sources: this.sources,
        rule: this.selectedRule,
        target: this.target,
        params: { ...this.convertParams, ...this.convertText, ...ruleModeParams(this.ruleMode) },
      })
    },

    defaultOutputFilename() {
      const ruleName = this.ruleOptions.find(o => o.value === this.selectedRule)?.text || '规则配置'
      const scriptLabel = this.yamlforge.scriptOptions.find(o => o.value === this.yamlforge.selectedScript)?.text || 'JS脚本'
      const scriptName = scriptLabel.split(' - ')[0].replace(/\.js$/i, '')
      const now = new Date()
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const parts = [ruleName]
      if (this.yamlforge.enabled) parts.push(scriptName)
      parts.push(date)
      const name = parts.join('_').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
      return `${mergedPrefix(this.sources.length)}${name}.yaml`
    },

    buildYamlForgeUrl(subUrl) {
      if (!this.yamlforge.enabled) return subUrl
      if (!this.yamlforge.selectedScript) { showWarning('请选择 JS 脚本'); return null }
      const backend = window.config?.yamlforge?.backend
      const apiKey = window.config?.yamlforge?.apiKey || ''
      if (!backend) { showWarning('请配置 YamlForge 后端地址'); return null }
      let url = `${backend}/yamlprocess?api_key=${apiKey}&source=${encodeURIComponent(subUrl)}&merge=${encodeURIComponent(this.yamlforge.selectedScript)}`
      let filename = this.yamlforge.filename.trim() || this.defaultOutputFilename()
      if (filename && !filename.match(/\.ya?ml$/i)) filename += ".yaml"
      if (filename) url += `&filename=${encodeURIComponent(filename)}`
      return url
    },

    getSubUrl() {
      const subUrl = this.buildSubconverterUrl()
      if (!subUrl) return
      this.result.subUrl = this.buildYamlForgeUrl(subUrl) || ''
      if (this.result.subUrl) this.toCopy(this.result.subUrl, '订阅链接')
    },

    buildShlinkTags() {
      const parts = []
      parts.push(sourceLabel(this.sources, value => this.sourceLabelOf(value)))
      const ruleName = (this.ruleOptions.find(o => o.value === this.selectedRule)?.text || "UnknownRule").split(' - ')[0]
      parts.push(ruleName)
      if (this.yamlforge.enabled && this.yamlforge.selectedScript) {
        const scriptName = (this.yamlforge.scriptOptions.find(o => o.value === this.yamlforge.selectedScript)?.text || '').split(' - ')[0]
        if (scriptName) parts.push(scriptName)
      }
      return [parts.join('-')]
    },

    async generateShlinkUrl() {
      const subUrl = this.buildSubconverterUrl()
      if (!subUrl) return
      const finalUrl = this.buildYamlForgeUrl(subUrl)
      if (!finalUrl) return

      const backend = window.config?.shlink?.backend
      const apiKey = window.config?.shlink?.apiKey
      if (!backend || !apiKey) { showWarning('请配置 Shlink 后端地址和 API Key'); return }

      const loading = ElLoading.service({ fullscreen: true })
      try {
        const res = await apiRequest('post', '/shlink/short-urls', {
          longUrl: finalUrl,
          customSlug: this.shlink.customSlug || undefined,
          tags: this.buildShlinkTags(),
        })

        if (res.shortUrl) {
          const publicUrl = window.config?.shlink?.publicUrl || ''
          const code = res.shortCode
          this.result.shortUrl = publicUrl ? `${publicUrl.replace(/\/$/, '')}/${code}` : res.shortUrl
          this.toCopy(this.result.shortUrl, 'Shlink 短链接')
        } else {
          showError('Shlink 短链接生成失败，请检查配置')
        }
      } catch (e) {
        showError(e.response?.data?.detail || e.response?.data?.message || 'Shlink 短链接生成失败')
      } finally {
        loading.close()
      }
    },
  },
}
</script>

<style scoped>
.sub-card { background: var(--el-bg-color); border-radius: 8px; padding: 30px; box-shadow: var(--nexus-panel-shadow); }
.checkbox-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 16px; }
.result-row { display: flex; gap: 10px; width: 100%; }
.result-row .el-input { flex: 1; }
.merge-hint { margin-top: 6px; font-size: 12px; color: var(--el-text-color-secondary); }
.advanced { margin: 4px 0 16px; }
@media (max-width: 600px) {
  .checkbox-grid { grid-template-columns: repeat(2, 1fr); }
  .result-row { flex-direction: column; }
}
</style>
