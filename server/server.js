import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 25503;
const CONFIG_FILE = process.env.CONFIG_FILE || join(__dirname, 'config.json');

app.use(cors());
app.use(express.json());

// ============ TOTP 实现 ============

function base32Encode(buffer) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, '0');
  }
  let result = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substr(i, 5).padEnd(5, '0');
    result += alphabet[parseInt(chunk, 2)];
  }
  return result;
}

function generateSecret() {
  const buffer = crypto.randomBytes(20);
  return base32Encode(buffer);
}

function base32Decode(secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const char of secret.toUpperCase()) {
    const val = alphabet.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const key = Buffer.alloc(Math.floor(bits.length / 8));
  for (let i = 0; i < key.length; i++) {
    key[i] = parseInt(bits.substr(i * 8, 8), 2);
  }
  return key;
}

function generateTOTP(secret, timeOffset = 0) {
  const key = base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / 30) + timeOffset;
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(0, 0);
  counterBuffer.writeUInt32BE(counter, 4);
  
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(counterBuffer);
  const hash = hmac.digest();
  
  const offset = hash[hash.length - 1] & 0x0f;
  const code = (
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  ) % 1000000;
  
  return code.toString().padStart(6, '0');
}

function verifyTOTP(secret, token) {
  for (let i = -1; i <= 1; i++) {
    if (generateTOTP(secret, i) === token) {
      return true;
    }
  }
  return false;
}

// ============ 认证存储 ============

const AUTH_FILE = process.env.AUTH_FILE || join(__dirname, 'auth.json');
const RATE_LIMIT_WINDOW = 60000;
const MAX_ATTEMPTS = 5;

let authConfig = {
  totpSecret: null,
  initialized: true
};

let rateLimitStore = {};
let validTokens = new Set();

function loadOrInitAuthConfig() {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const data = fs.readFileSync(AUTH_FILE, 'utf8');
      const saved = JSON.parse(data);
      if (saved.totpSecret) {
        authConfig.totpSecret = saved.totpSecret;
        console.log('已加载TOTP密钥');
        return;
      }
    }
  } catch (e) {
    console.error('Error loading auth config:', e);
  }
  
  authConfig.totpSecret = generateSecret();
  saveAuthConfig();
  console.log('=================================');
  console.log('已生成新的TOTP密钥:');
  console.log(authConfig.totpSecret);
  console.log('=================================');
}

function saveAuthConfig() {
  try {
    const dir = dirname(AUTH_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(AUTH_FILE, JSON.stringify(authConfig, null, 2));
  } catch (e) {
    console.error('Error saving auth config:', e);
  }
}

loadOrInitAuthConfig();

function getClientIP(req) {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
}

function checkRateLimit(ip) {
  const now = Date.now();
  const limit = rateLimitStore[ip];
  
  if (!limit || now > limit.resetTime) {
    rateLimitStore[ip] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }
  
  if (limit.count >= MAX_ATTEMPTS) {
    const waitSeconds = Math.ceil((limit.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, waitSeconds };
  }
  
  limit.count++;
  return { allowed: true, remaining: MAX_ATTEMPTS - limit.count };
}

// 默认配置（示例，用户需要根据自己的情况修改）
const defaultConfig = {
  nodeOptions: [
    { value: 'https://example.com/your-subscription.txt', text: '订阅源' }
  ],
  ruleOptions: [
    { value: 'https://example.com/rule1.ini', text: '规则1' },
    { value: 'https://example.com/rule2.ini', text: '规则2' }
  ],
  yamlforgeScripts: [
    { value: 'https://example.com/script1.js', text: '脚本1' },
    { value: 'https://example.com/script2.js', text: '脚本2' }
  ],
  apiUrl: 'http://localhost:25500',
  yamlforgeBackend: 'http://localhost:25501',
  yamlforgeApiKey: '',
  shlinkBackend: 'http://localhost:25502',
  shlinkApiKey: '',
  shlinkPublicUrl: 'http://localhost:25502'
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading config:', e);
  }
  return null;
}

function saveConfig(config) {
  try {
    const dir = dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (e) {
    console.error('Error writing config:', e);
    return false;
  }
}

// ============ API 路由 ============

app.get('/api/auth/status', (req, res) => {
  res.json({
    success: true,
    initialized: authConfig.initialized,
    hasSecret: !!authConfig.totpSecret
  });
});

app.post('/api/auth/login', (req, res) => {
  const ip = getClientIP(req);
  const { token } = req.body;
  
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      message: `请求过于频繁，请${rateCheck.waitSeconds}秒后重试`,
      waitSeconds: rateCheck.waitSeconds
    });
  }
  
  if (!token || !verifyTOTP(authConfig.totpSecret, token)) {
    return res.json({
      success: false,
      message: '验证码错误',
      remaining: rateCheck.remaining
    });
  }
  
  const accessToken = crypto.randomBytes(32).toString('hex');
  validTokens.add(accessToken);
  
  setTimeout(() => {
    validTokens.delete(accessToken);
  }, 86400000);
  
  res.json({
    success: true,
    token: accessToken,
    expiresIn: 86400
  });
});

function requireAuth(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  
  if (!token || !validTokens.has(token)) {
    return res.status(401).json({
      success: false,
      message: '未授权'
    });
  }
  
  next();
}

app.get('/api/config', requireAuth, (req, res) => {
  const config = loadConfig();
  res.json({ success: true, data: config || defaultConfig });
});

app.post('/api/config', requireAuth, (req, res) => {
  if (saveConfig(req.body)) {
    res.json({ success: true, message: '配置已保存' });
  } else {
    res.status(500).json({ success: false, message: '保存失败' });
  }
});

app.post('/api/config/reset', requireAuth, (req, res) => {
  if (saveConfig(defaultConfig)) {
    res.json({ success: true, message: '已重置', data: defaultConfig });
  } else {
    res.status(500).json({ success: false, message: '重置失败' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`配置服务器运行在 http://localhost:${PORT}`);
  console.log(`TOTP密钥文件: ${AUTH_FILE}`);
});
