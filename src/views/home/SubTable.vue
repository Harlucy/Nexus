<template>
  <div class="row g-4 custom-div">
    <div class="col-12 col-lg-12 pt-4 pt-lg-0">
      <div class="tab-content p-0">
        <div class="tab-pane fade show active">
          <div class="card mb-4">
            <div class="card-body">
              <div class="row mb-3 g-3">
                <!-- 节点集合 -->
                <div class="col-12 col-md-12">
                  <label class="form-label">节点集合</label>
                  <select class="form-select" v-model="selectedNode">
                    <option v-for="option in nodeOptions" :key="option.value" :value="option.value">
                      {{ option.text }}
                    </option>
                  </select>
                </div>

                <!-- 规则配置 -->
                <div class="col-12 col-md-12">
                  <label class="form-label">规则配置</label>
                  <select class="form-select" v-model="selectedRule">
                    <option v-for="option in ruleOptions" :key="option.value" :value="option.value">
                      {{ option.text }}
                    </option>
                  </select>
                </div>

                <!-- 客户端 -->
                <div class="col-12 col-md-12">
                  <label class="form-label">客户端</label>
                  <select class="form-select" v-model="target">
                    <option v-for="option in targetOptions" :key="option.value" :value="option.value">
                      {{ option.text }}
                    </option>
                  </select>
                </div>

                <!-- 转换参数 -->
                <div class="col-12 col-md-12">
                  <label class="form-label">转换参数</label>
                  <div class="row g-2">
                    <div class="col-6 col-md-4">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="newName" v-model="convertParams.new_name" />
                        <label class="form-check-label" for="newName">新组名称</label>
                      </div>
                    </div>
                    <div class="col-6 col-md-4">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="classic" v-model="convertParams.classic" />
                        <label class="form-check-label" for="classic">经典规则</label>
                      </div>
                    </div>
                    <div class="col-6 col-md-4">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="expand" v-model="convertParams.expand" />
                        <label class="form-check-label" for="expand">展开规则</label>
                      </div>
                    </div>
                    <div class="col-6 col-md-4">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="emoji" v-model="convertParams.emoji" />
                        <label class="form-check-label" for="emoji">Emoji</label>
                      </div>
                    </div>
                    <div class="col-6 col-md-4">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="addEmoji" v-model="convertParams.add_emoji" />
                        <label class="form-check-label" for="addEmoji">添加Emoji</label>
                      </div>
                    </div>
                    <div class="col-6 col-md-4">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="removeEmoji" v-model="convertParams.remove_emoji" />
                        <label class="form-check-label" for="removeEmoji">移除Emoji</label>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- YamlForge 开关 -->
                <div class="col-12 col-md-12">
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="yamlforgeSwitch" v-model="yamlforge.enabled" />
                    <label class="form-check-label" for="yamlforgeSwitch">YamlForge 高级处理/合并</label>
                  </div>
                </div>

                <!-- YamlForge JS 脚本选择 -->
                <div v-if="yamlforge.enabled" class="col-12 col-md-12">
                  <label class="form-label">JS 脚本选择</label>
                  <select class="form-select" v-model="yamlforge.selectedScript">
                    <option value="">请选择 JS 脚本</option>
                    <option v-for="option in yamlforge.scriptOptions" :key="option.value" :value="option.value">
                      {{ option.text }}
                    </option>
                  </select>
                </div>

                <!-- 输出文件名 -->
                <div v-if="yamlforge.enabled" class="col-12 col-md-12">
                  <label class="form-label">输出文件名（可选）</label>
                  <input class="form-control" placeholder="例如：UPCMYMOBILE.yaml" v-model="yamlforge.filename" />
                </div>

                <!-- 分割线 -->
                <div class="col-12 col-md-12">
                  <hr />
                </div>

                <!-- 生成订阅链接 -->
                <div class="col-12 col-md-10">
                  <input class="form-control" placeholder="点击转换生成订阅链接" v-model.trim="result.subUrl" readonly />
                </div>
                <div class="col-12 col-md-2">
                  <button type="button" class="btn btn-success" @click="getSubUrl()">转换</button>
                </div>

                <!-- 生成短链接 -->
                <div class="col-12 col-md-10">
                  <input class="form-control" placeholder="点击生成 Shlink 短链接" v-model.trim="result.shortUrl" readonly />
                </div>
                <div class="col-12 col-md-2">
                  <button type="button" class="btn btn-info" @click="generateShlinkUrl()">生成短链</button>
                </div>

                <!-- 自定义短链接后缀 -->
                <div class="col-12 col-md-12">
                  <label class="form-label">自定义短链接后缀（Slug，可选）</label>
                  <input class="form-control" placeholder="例如：KsUPe 或 UPCM_YMOBILE" v-model="shlink.customSlug" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { showLoading, hideLoading } from '@/components/loading';
import { request } from '@/network';
import showNotification from '@/components/notification';

export default {
  name: 'SubTable',
  data() {
    return {
      // 节点集合选项
      nodeOptions: [
        { value: 'https://gist.githubusercontent.com/Harlucy/94137d4de17bcdd8c6015e7dba8eec01/raw/ClashSelf', text: 'ClashSelf - 节点集合' },
      ],
      selectedNode: 'https://gist.githubusercontent.com/Harlucy/94137d4de17bcdd8c6015e7dba8eec01/raw/ClashSelf',

      // 规则配置选项
      ruleOptions: [
        { value: 'https://raw.githubusercontent.com/Harlucy/howmagicrule/refs/heads/main/clash-rule.ini', text: '黑名单模式' },
        { value: 'https://raw.githubusercontent.com/Harlucy/howmagicrule/refs/heads/main/clash-rule-manual.ini', text: '黑名单手动模式' },
        { value: 'https://raw.githubusercontent.com/Harlucy/howmagicrule/refs/heads/main/clash-rule-black.ini', text: '白名单模式' },
        { value: 'https://raw.githubusercontent.com/Harlucy/howmagicrule/refs/heads/main/clash-rule-black-manual.ini', text: '白名单手动模式' },
      ],
      selectedRule: 'https://raw.githubusercontent.com/Harlucy/howmagicrule/refs/heads/main/clash-rule.ini',

      // 客户端选项
      targetOptions: [
        { value: 'clash', text: 'Clash' },
        { value: 'clashr', text: 'ClashR' },
        { value: 'v2ray', text: 'V2Ray' },
        { value: 'quanx', text: 'Quantumult X' },
        { value: 'surge&ver=4', text: 'SurgeV4' },
        { value: 'singbox', text: 'Sing-box' },
      ],
      target: 'clashr',

      // 转换参数
      convertParams: {
        new_name: true,
        classic: true,
        expand: true,
        emoji: true,
        add_emoji: false,
        remove_emoji: false,
      },

      // YamlForge 配置
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

      // Shlink 配置
      shlink: {
        customSlug: '',
      },

      // 结果
      result: {
        subUrl: '',
        shortUrl: '',
      },

      // 客户端对应的默认文件名后缀
      targetFileMap: {
        clash: 'Clash.yaml',
        clashr: 'ClashR.yaml',
        v2ray: 'V2Ray.txt',
        quanx: 'QuantumultX.conf',
        'surge&ver=4': 'Surge.sgmodule',
        singbox: 'SingBox.json',
      },
    };
  },
  watch: {
    target(newVal) {
      // 当客户端变化时，自动设置YamlForge的默认文件名
      if (this.targetFileMap[newVal]) {
        this.yamlforge.filename = this.targetFileMap[newVal];
      }
    },
  },
  created() {
    this.loadAdminConfig();
  },
  methods: {
    // 加载后台管理配置
    async loadAdminConfig() {
      try {
        const configServer = (window.config && window.config.configServer) || window.location.origin;
        const token = sessionStorage.getItem('admin_token');
        
        const response = await fetch(configServer + '/api/config', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (response.status === 401) {
          this.$router.push('/login');
          return;
        }
        const result = await response.json();
        if (result.success) {
          const adminConfig = result.data;
          
          // 加载节点选项
          if (adminConfig.nodeOptions && adminConfig.nodeOptions.length > 0) {
            this.nodeOptions = adminConfig.nodeOptions;
            this.selectedNode = this.nodeOptions[0].value;
          }
          
          // 加载规则选项
          if (adminConfig.ruleOptions && adminConfig.ruleOptions.length > 0) {
            this.ruleOptions = adminConfig.ruleOptions;
            this.selectedRule = this.ruleOptions[0].value;
          }
          
          // 加载YamlForge脚本选项
          if (adminConfig.yamlforgeScripts && adminConfig.yamlforgeScripts.length > 0) {
            this.yamlforge.scriptOptions = adminConfig.yamlforgeScripts;
          }
          
          // 加载API配置
          if (adminConfig.apiUrl) {
            window.config = window.config || {};
            window.config.apiUrl = adminConfig.apiUrl;
          }
          if (adminConfig.yamlforgeBackend) {
            window.config = window.config || {};
            window.config.yamlforge = window.config.yamlforge || {};
            window.config.yamlforge.backend = adminConfig.yamlforgeBackend;
          }
          if (adminConfig.yamlforgeApiKey) {
            window.config = window.config || {};
            window.config.yamlforge = window.config.yamlforge || {};
            window.config.yamlforge.apiKey = adminConfig.yamlforgeApiKey;
          }
          if (adminConfig.shlinkBackend) {
            window.config = window.config || {};
            window.config.shlink = window.config.shlink || {};
            window.config.shlink.backend = adminConfig.shlinkBackend;
          }
          if (adminConfig.shlinkApiKey) {
            window.config = window.config || {};
            window.config.shlink = window.config.shlink || {};
            window.config.shlink.apiKey = adminConfig.shlinkApiKey;
          }
          if (adminConfig.shlinkPublicUrl) {
            window.config = window.config || {};
            window.config.shlink = window.config.shlink || {};
            window.config.shlink.publicUrl = adminConfig.shlinkPublicUrl;
          }
        }
      } catch (e) {
        console.error('Failed to load admin config from API:', e);
      }
    },
    toCopy(url, title) {
      if (!url) {
        this.$showDialog('warning', '注意', '复制失败 内容为空');
        return;
      }
      var copyInput = document.createElement('input');
      copyInput.setAttribute('value', url);
      document.body.appendChild(copyInput);
      copyInput.select();
      try {
        var copyed = document.execCommand('copy');
        if (copyed) {
          document.body.removeChild(copyInput);
          showNotification(title + ' 复制成功', '成功');
        }
      } catch {
        this.$showDialog('warning', '注意', '复制失败，请检查浏览器兼容性');
      }
    },

    // 构建 Subconverter URL
    buildSubconverterUrl() {
      const api = window.config.apiUrl || 'http://82.158.91.229:25500';
      let url = api + '/sub?target=' + this.target;

      // 添加订阅链接
      url += '&url=' + encodeURIComponent(this.selectedNode);

      // 添加规则配置
      url += '&config=' + encodeURIComponent(this.selectedRule);

      // 添加转换参数
      if (this.convertParams.new_name) url += '&new_name=true';
      if (this.convertParams.classic) url += '&classic=true';
      if (this.convertParams.expand) url += '&expand=true';
      if (this.convertParams.emoji) url += '&emoji=true';
      if (this.convertParams.add_emoji) url += '&add_emoji=true';
      if (this.convertParams.remove_emoji) url += '&remove_emoji=true';

      return url;
    },

    // 获取订阅链接
    getSubUrl() {
      const subUrl = this.buildSubconverterUrl();
      // 如果启用了YamlForge，应用JS脚本处理
      if (this.yamlforge.enabled && this.yamlforge.selectedScript) {
        this.result.subUrl = this.buildYamlForgeUrl(subUrl);
      } else {
        this.result.subUrl = subUrl;
      }
      this.toCopy(this.result.subUrl, "订阅链接");
    },

    // 构建 YamlForge URL
    buildYamlForgeUrl(subUrl) {
      if (!this.yamlforge.enabled || !this.yamlforge.selectedScript) {
        return subUrl;
      }

      const yamlforgeBackend = window.config.yamlforge ? window.config.yamlforge.backend : '';
      const yamlforgeApiKey = window.config.yamlforge ? window.config.yamlforge.apiKey : '';

      if (!yamlforgeBackend) {
        this.$showDialog('warning', '注意', '请配置 YamlForge 后端地址');
        return null;
      }

      let url = yamlforgeBackend + '/yamlprocess?api_key=' + yamlforgeApiKey;
      url += '&source=' + encodeURIComponent(subUrl);
      url += '&merge=' + encodeURIComponent(this.yamlforge.selectedScript);

      if (this.yamlforge.filename) {
        url += '&filename=' + encodeURIComponent(this.yamlforge.filename);
      }

      return url;
    },

    // 生成短链接
    generateShlinkUrl() {
      const subUrl = this.buildSubconverterUrl();
      const finalUrl = this.buildYamlForgeUrl(subUrl);

      if (!finalUrl) return;

      const shlinkBackend = window.config.shlink ? window.config.shlink.backend : '';
      const shlinkApiKey = window.config.shlink ? window.config.shlink.apiKey : '';

      if (!shlinkBackend || !shlinkApiKey) {
        this.$showDialog('warning', '注意', '请配置 Shlink 后端地址和 API Key');
        return;
      }

      showLoading();
      request({
        method: 'post',
        url: shlinkBackend + '/rest/v3/short-urls',
        headers: {
          'X-Api-Key': shlinkApiKey,
          'Content-Type': 'application/json',
        },
        data: {
          longUrl: finalUrl,
          customSlug: this.shlink.customSlug || undefined,
          tags: ['Subscription'],
        },
      })
        .then((res) => {
          if (res.data && res.data.shortUrl) {
            const shlinkPublicUrl = window.config.shlink ? window.config.shlink.publicUrl : '';
            const shortCode = res.data.shortUrl.split('/').pop();
            this.result.shortUrl = shlinkPublicUrl ? shlinkPublicUrl + '/' + shortCode : res.data.shortUrl;
            this.toCopy(this.result.shortUrl, 'Shlink 短链接');
          } else {
            this.$showDialog('error', '失败', 'Shlink 短链接生成失败，请检查配置');
          }
          hideLoading();
        })
        .catch(() => {
          this.$showDialog('error', '失败', 'Shlink 短链接生成失败 请检查 Shlink 服务是否可用');
          hideLoading();
        });
    },
  },
};
</script>

<style scoped>
.custom-div {
  width: 100%;
  margin: 0 auto;
}
@media (min-width: 767.98px) {
  .custom-div {
    width: 90%;
    margin: 0 auto;
  }
}
@media (min-width: 991.98px) {
  .custom-div {
    width: 80%;
    margin: 0 auto;
  }
}
@media (min-width: 1199.98px) {
  .custom-div {
    width: 70%;
    margin: 0 auto;
  }
}

.btn {
  width: 100%;
}

.form-check-input:checked {
  background-color: #696cff;
  border-color: #696cff;
}

hr {
  margin: 0.5rem 0;
}
</style>
