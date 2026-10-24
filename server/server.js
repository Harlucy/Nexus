import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1] in process.env) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

loadDotEnv(join(APP_ROOT, '.env'));

const app = express();
const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 25503);
const STATIC_DIR = process.env.STATIC_DIR || join(APP_ROOT, 'dist');
const CONFIG_FILE = process.env.CONFIG_FILE || join(APP_ROOT, 'data', 'config', 'config.json');

app.use(cors());
app.use(express.json());

const RULE_BASE = 'https://raw.githubusercontent.com/Harlucy/howmagicrule/refs/heads/main';

const defaultConfig = {
  nodeOptions: [{ value: 'https://example.com/your-subscription.txt', text: '订阅源' }],
  ruleOptions: [
    { value: `${RULE_BASE}/clash-rule.ini`, text: '白名单模式（漏网走代理）' },
    { value: `${RULE_BASE}/clash-rule-manual.ini`, text: '白名单手动模式（漏网走代理）' },
    { value: `${RULE_BASE}/clash-rule-black.ini`, text: '黑名单模式（漏网走直连）' },
    { value: `${RULE_BASE}/clash-rule-black-manual.ini`, text: '黑名单手动模式（漏网走直连）' },
    { value: `${RULE_BASE}/clash-rule-general.ini`, text: '通用精简模式（漏网走代理）' },
    { value: `${RULE_BASE}/clash-rule-manual-test.ini`, text: '手动测试模式（漏网走代理）' },
    { value: `${RULE_BASE}/clash-rule-ad.ini`, text: '白名单 + 广告拦截（补充规则）' }
  ],
  yamlforgeScripts: [
    { value: 'https://example.com/script1.js', text: '脚本1' },
    { value: 'https://example.com/script2.js', text: '脚本2' }
  ],
  apiUrl: process.env.API_URL || 'http://localhost:25500',
  yamlforgeBackend: process.env.YAMLFORGE_BACKEND || 'http://localhost:25501',
  yamlforgeApiKey: process.env.YAMLFORGE_API_KEY || '',
  shlinkBackend: process.env.SHLINK_BACKEND || 'http://localhost:25502',
  shlinkApiKey: process.env.SHLINK_API_KEY || '',
  shlinkPublicUrl: process.env.SHLINK_PUBLIC_URL || 'http://localhost:25502'
};

function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) return { ...defaultConfig };
  return { ...defaultConfig, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
}

function saveConfig(config) {
  fs.mkdirSync(dirname(CONFIG_FILE), { recursive: true });
  // Replace atomically so an interrupted save does not truncate the live config.
  const temporary = `${CONFIG_FILE}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(config, null, 2));
  fs.renameSync(temporary, CONFIG_FILE);
}

app.get('/conf/config.js', (req, res) => {
  const config = loadConfig();
  const frontendConfig = {
    siteName: process.env.SITE_NAME || 'Nexus',
    adminPath: process.env.ADMIN_PATH || 'admin',
    apiUrl: config.apiUrl,
    yamlforge: { backend: config.yamlforgeBackend, apiKey: config.yamlforgeApiKey },
    shlink: { backend: config.shlinkBackend, apiKey: config.shlinkApiKey, publicUrl: config.shlinkPublicUrl }
  };
  res.set('Cache-Control', 'no-store').type('application/javascript')
    .send(`window.config = ${JSON.stringify(frontendConfig)};\n`);
});

app.get('/api/config', (req, res) => {
  res.set('Cache-Control', 'no-store').json({ success: true, data: loadConfig() });
});

app.post('/api/config', (req, res) => {
  if (!req.body || Array.isArray(req.body) || typeof req.body !== 'object') {
    return res.status(400).json({ success: false, message: '配置格式错误' });
  }
  saveConfig({ ...defaultConfig, ...req.body });
  res.json({ success: true, message: '配置已保存' });
});

app.post('/api/config/reset', (req, res) => {
  saveConfig(defaultConfig);
  res.json({ success: true, message: '已重置', data: defaultConfig });
});

// Proxy Shlink through the local server to avoid browser CORS restrictions.
async function shlinkRequest(req, res, method, path, query = {}) {
  try {
    const config = loadConfig();
    if (!config.shlinkBackend || !config.shlinkApiKey) {
      return res.status(400).json({ message: '请先配置 Shlink 后端地址和 API Key' });
    }
    const url = new URL(`${config.shlinkBackend.replace(/\/$/, '')}/rest/v3/${path}`);
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'string' && value) url.searchParams.set(key, value);
    }
    const response = await fetch(url, {
      method,
      headers: { 'X-Api-Key': config.shlinkApiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: method === 'GET' ? undefined : JSON.stringify(req.body),
      signal: AbortSignal.timeout(20000)
    });
    const body = await response.text();
    if (!body) return res.status(response.status).end();
    res.status(response.status).json(JSON.parse(body));
  } catch (error) {
    console.error('Shlink request failed:', error.message);
    res.status(502).json({ message: '无法连接 Shlink 服务，请检查后端地址和网络' });
  }
}

app.get('/api/shlink/short-urls', (req, res) => {
  const { page, itemsPerPage, searchTerm } = req.query;
  return shlinkRequest(req, res, 'GET', 'short-urls', { page, itemsPerPage, searchTerm });
});

app.post('/api/shlink/short-urls', (req, res) => {
  return shlinkRequest(req, res, 'POST', 'short-urls');
});

app.patch('/api/shlink/short-urls/:shortCode', (req, res) => {
  return shlinkRequest(req, res, 'PATCH', `short-urls/${encodeURIComponent(req.params.shortCode)}`, { domain: req.query.domain });
});

app.delete('/api/shlink/short-urls/:shortCode', (req, res) => {
  return shlinkRequest(req, res, 'DELETE', `short-urls/${encodeURIComponent(req.params.shortCode)}`, { domain: req.query.domain });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(express.static(STATIC_DIR, { index: 'index.html' }));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(join(STATIC_DIR, 'index.html'));
});
app.use((error, req, res, next) => {
  console.error('Local server error:', error.message);
  res.status(error.status || 500).json({ success: false, message: '请求处理失败，请检查本地配置文件' });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Nexus 本地服务运行在 http://${HOST}:${server.address().port}`);
  console.log(`前端目录: ${STATIC_DIR}`);
  console.log(`配置文件: ${CONFIG_FILE}`);
});
