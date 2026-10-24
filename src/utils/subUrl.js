// 订阅源合并与 Subconverter 链接构造：纯函数，便于 node --test 直接验证。

export function isHttpUrl(value) {
  return /^https?:\/\/\S+$/i.test(String(value ?? '').trim())
}

/**
 * 选中的订阅源（可多选）与追加粘贴的链接合并成一条有序、去重的 URL 列表。
 * 追加内容按换行、空格、中英文逗号切分。
 */
export function collectSources(selected, extraText = '') {
  const picked = Array.isArray(selected) ? selected : [selected]
  const extra = String(extraText ?? '').split(/[\s,，]+/)
  const urls = [...picked, ...extra].map(item => String(item ?? '').trim()).filter(isHttpUrl)
  return [...new Set(urls)]
}

/** Subconverter 用 `|` 分隔多个订阅链接，合并后整体 URL 编码一次。 */
export function buildSubconverterUrl({ api, sources, rule, target, params = {} }) {
  if (!api || !Array.isArray(sources) || sources.length === 0 || !rule) return ''
  const base = `${String(api).replace(/\/+$/, '')}/sub?target=${target}`
    + `&url=${encodeURIComponent(sources.join('|'))}&config=${encodeURIComponent(rule)}`
  return Object.entries(params).reduce((url, [key, value]) => {
    // 布尔值显式写出 true/false：省略 expand 时服务端默认按 true 处理。
    if (value === true || value === false) return `${url}&${key}=${value}`
    if (value === null || value === undefined) return url
    const text = String(value).trim()
    return text === '' ? url : `${url}&${key}=${encodeURIComponent(text)}`
  }, base)
}

/** 单源用来源名，多源用「合并N源」，避免文件名和短链标签过长。 */
export function sourceLabel(sources, labelOf) {
  const labels = (Array.isArray(sources) ? sources : []).map(labelOf).filter(Boolean)
  if (labels.length === 0) return 'UnknownNode'
  if (labels.length === 1) return labels[0]
  return `合并${labels.length}源`
}

/** 多源时给输出文件名加前缀，避免同名文件在客户端互相覆盖。 */
export function mergedPrefix(count) {
  return count > 1 ? `合并${count}源_` : ''
}

/**
 * 规则下发方式 → Subconverter 参数。
 * 必须显式传 expand=false 才会生成 rule-providers + RULE-SET 引用（约 70 KB，客户端按 interval 缓存）；
 * 省略 expand 时服务端默认按 true 处理，会把每个 ruleset 展开成一条条规则写进配置（约 1 MB）。
 */
export function ruleModeParams(mode) {
  return { expand: mode === 'inline' }
}

/**
 * /sub 支持的布尔参数，default 取自 subconverter 文档的默认/推荐值。
 * label 用于界面，note 用于悬浮说明。
 */
export const BOOLEAN_PARAMS = [
  { key: 'new_name', label: '新组名称', default: true, note: 'Clash 新区块名 proxies / proxy-groups / rules' },
  { key: 'emoji', label: 'Emoji', default: true, note: '节点名是否包含 Emoji' },
  { key: 'add_emoji', label: '添加 Emoji', default: true, note: '按 pref 的 emoji 规则在节点名前加 Emoji' },
  { key: 'remove_emoji', label: '移除旧 Emoji', default: true, note: '先删除节点名中原有的 Emoji' },
  { key: 'append_info', label: '流量信息', default: true, note: '保留流量/到期信息节点（append_info）' },
  { key: 'insert', label: '插入 insert_url', default: true, note: '是否插入 pref 中 insert_url 的节点' },
  { key: 'prepend', label: 'insert 前置', default: true, note: 'insert_url 的节点是否排在最前面' },
  { key: 'fdn', label: '过滤不支持节点', default: true, note: 'fdn：过滤目标类型不支持的节点' },
  { key: 'append_type', label: '节点类型前缀', default: false, note: '在节点名前插入 [SS]/[VMess] 等类型' },
  { key: 'sort', label: '按名排序', default: false, note: 'sort：对节点与策略组按名称重排' },
  { key: 'tfo', label: 'TCP Fast Open', default: false, note: 'tfo：为节点开启 TCP Fast Open' },
  { key: 'udp', label: 'UDP', default: false, note: 'udp：为节点开启 UDP' },
  { key: 'scv', label: '跳过证书校验', default: false, note: 'scv：关闭 TLS 节点证书检查' },
  { key: 'tls13', label: 'TLS 1.3', default: false, note: 'tls13：为节点增加 tls1.3 参数' },
  { key: 'script', label: 'Clash Script', default: false, note: 'script：生成 Clash Script' },
  { key: 'list', label: '仅节点列表', default: false, note: 'list：只输出节点/Provider 列表，不生成完整配置' },
  { key: 'strict', label: '强制更新', default: false, note: 'strict：托管配置到期后强制更新（Surge/Surfboard）' },
  { key: 'classic', label: 'Classical Provider', default: true, note: 'classic：把 Surge/QuanX 等非 Clash 规则集也做成 rule-providers（classical）；Clash 原生规则集不受影响' },
  { key: 'upload', label: '上传 Gist', default: false, note: 'upload：把生成结果上传到 Gist，需要 gistconf' },
]

/**
 * /sub 支持的字符串/数值参数，留空则不写进链接。
 * 标注 api_mode 的参数只在服务端开启 api_mode 时才要求 token；本服务器 pref.toml 里是 false。
 */
export const TEXT_PARAMS = [
  { key: 'interval', label: '更新间隔（秒）', placeholder: 'interval，例如 86400；留空用服务端默认' },
  { key: 'include', label: '仅保留节点', placeholder: 'include 正则，例如 (?<=美).*(BGP|GIA)' },
  { key: 'exclude', label: '排除节点', placeholder: 'exclude 正则，例如 (到期|剩余流量|官网)' },
  { key: 'rename', label: '重命名规则', placeholder: 'rename，例如 中国@中（api_mode=true 时才需 token）' },
  { key: 'filter_script', label: '筛选脚本', placeholder: 'filter_script：function filter(node){…}（api_mode=true 时才需 token）' },
  { key: 'sort_script', label: '排序脚本', placeholder: 'sort_script：function compare(a,b){…}（api_mode=true 时才需 token）' },
  { key: 'group', label: '订阅组名', placeholder: 'group，多用于 SSD/SSR' },
  { key: 'dev_id', label: 'QX 设备 ID', placeholder: 'dev_id，仅 QuantumultX' },
  { key: 'upload_path', label: 'Gist 文件名', placeholder: 'upload_path，配合 upload=true' },
]

/** 按文档默认/推荐值初始化布尔参数。 */
export function defaultBooleanParams() {
  return Object.fromEntries(BOOLEAN_PARAMS.map(item => [item.key, item.default]))
}

/** 初始化文本参数（全部留空）。 */
export function defaultTextParams() {
  return Object.fromEntries(TEXT_PARAMS.map(item => [item.key, '']))
}
