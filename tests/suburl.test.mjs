import test from 'node:test'
import assert from 'node:assert/strict'
import { collectSources, buildSubconverterUrl, sourceLabel, mergedPrefix, ruleModeParams, BOOLEAN_PARAMS, TEXT_PARAMS, defaultBooleanParams, defaultTextParams } from '../src/utils/subUrl.js'

test('多订阅合并：选中项与粘贴内容去重、过滤非 http 链接', () => {
  const merged = collectSources(
    ['https://a.example/sub', 'https://b.example/sub'],
    'https://b.example/sub\n https://c.example/sub，ftp://x/y 不是链接'
  )
  assert.deepEqual(merged, ['https://a.example/sub', 'https://b.example/sub', 'https://c.example/sub'])
})

test('单订阅保持原有 URL 结构', () => {
  const url = new URL(buildSubconverterUrl({
    api: 'https://conv.example.com/',
    sources: ['https://a.example/sub'],
    rule: 'https://rules.example/clash-rule.ini',
    target: 'clash',
    params: { new_name: true, classic: true, emoji: false }
  }))
  assert.equal(url.origin, 'https://conv.example.com')
  assert.equal(url.pathname, '/sub')
  assert.equal(url.searchParams.get('url'), 'https://a.example/sub')
  assert.equal(url.searchParams.get('config'), 'https://rules.example/clash-rule.ini')
  assert.equal(url.searchParams.get('new_name'), 'true')
  assert.equal(url.searchParams.get('emoji'), 'false')
})

test('多订阅用 | 合并后再整体编码', () => {
  const raw = buildSubconverterUrl({
    api: 'https://conv.example.com',
    sources: ['https://a.example/sub', 'https://b.example/sub'],
    rule: 'https://rules.example/clash-rule.ini',
    target: 'clash',
  })
  assert.match(raw, /url=https%3A%2F%2Fa\.example%2Fsub%7Chttps%3A%2F%2Fb\.example%2Fsub/)
  assert.equal(new URL(raw).searchParams.get('url'), 'https://a.example/sub|https://b.example/sub')
})

test('缺少订阅源或规则时不生成链接', () => {
  assert.equal(buildSubconverterUrl({ api: 'https://conv.example.com', sources: [], rule: 'r', target: 'clash' }), '')
  assert.equal(buildSubconverterUrl({ api: 'https://conv.example.com', sources: ['https://a.example'], rule: '', target: 'clash' }), '')
  assert.equal(buildSubconverterUrl({ api: '', sources: ['https://a.example'], rule: 'r', target: 'clash' }), '')
})

test('标签与文件名前缀按合并数量区分', () => {
  const labelOf = value => ({ 'https://a.example': '自用', 'https://b.example': '共享' })[value]
  assert.equal(sourceLabel(['https://a.example'], labelOf), '自用')
  assert.equal(sourceLabel(['https://a.example', 'https://b.example'], labelOf), '合并2源')
  assert.equal(sourceLabel([], labelOf), 'UnknownNode')
  assert.equal(mergedPrefix(1), '')
  assert.equal(mergedPrefix(3), '合并3源_')
})

test('规则模式显式映射到 expand 参数', () => {
  assert.deepEqual(ruleModeParams('provider'), { expand: false })
  assert.deepEqual(ruleModeParams('inline'), { expand: true })
  const base = { api: 'https://conv.example.com', sources: ['https://a.example'], rule: 'https://r.example/i.ini', target: 'clashr' }
  const provider = new URL(buildSubconverterUrl({ ...base, params: { new_name: true, ...ruleModeParams('provider') } }))
  const inline = new URL(buildSubconverterUrl({ ...base, params: { new_name: true, ...ruleModeParams('inline') } }))
  // 省略 expand 会被服务端当成 true，所以这里必须显式写出 false
  assert.equal(provider.searchParams.get('expand'), 'false')
  assert.equal(inline.searchParams.get('expand'), 'true')
  assert.equal(provider.searchParams.get('new_name'), 'true')
})

test('布尔参数按文档默认值初始化并全部显式下发', () => {
  const defaults = defaultBooleanParams()
  assert.equal(defaults.new_name, true)
  assert.equal(defaults.emoji, true)
  assert.equal(defaults.add_emoji, true)
  assert.equal(defaults.remove_emoji, true)
  assert.equal(defaults.insert, true)
  assert.equal(defaults.prepend, true)
  assert.equal(defaults.fdn, true)
  assert.equal(defaults.append_info, true)
  assert.equal(defaults.tfo, false)
  assert.equal(defaults.udp, false)
  assert.equal(defaults.sort, false)
  assert.equal(defaults.upload, false)
  assert.equal(Object.keys(defaults).length, BOOLEAN_PARAMS.length)

  const url = new URL(buildSubconverterUrl({
    api: 'https://conv.example.com',
    sources: ['https://a.example'],
    rule: 'https://r.example/i.ini',
    target: 'clashr',
    params: { ...defaults, ...ruleModeParams('provider') },
  }))
  for (const item of BOOLEAN_PARAMS) {
    assert.equal(url.searchParams.get(item.key), String(item.default), `参数 ${item.key} 应显式下发`)
  }
  assert.equal(url.searchParams.get('expand'), 'false')
})

test('文本参数留空不下发，有值时按原值传递', () => {
  const defaults = defaultTextParams()
  assert.equal(Object.keys(defaults).length, TEXT_PARAMS.length)
  assert.ok(Object.values(defaults).every(value => value === ''))

  const base = { api: 'https://conv.example.com', sources: ['https://a.example'], rule: 'https://r.example/i.ini', target: 'clashr' }
  const empty = new URL(buildSubconverterUrl({ ...base, params: { ...defaults, ...defaultBooleanParams() } }))
  for (const item of TEXT_PARAMS) assert.equal(empty.searchParams.has(item.key), false, `空值 ${item.key} 不应出现`)

  const filled = new URL(buildSubconverterUrl({
    ...base,
    params: {
      ...defaults,
      ...defaultBooleanParams(),
      interval: '86400',
      exclude: '(流量|官网)',
      rename: '中国@中',
    },
  }))
  assert.equal(filled.searchParams.get('interval'), '86400')
  assert.equal(filled.searchParams.get('exclude'), '(流量|官网)')
  assert.equal(filled.searchParams.get('rename'), '中国@中')
  assert.equal(filled.searchParams.has('include'), false)
})
