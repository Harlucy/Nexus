import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const temporary = mkdtempSync(join(tmpdir(), 'nexus-test-'));
const requests = [];
let upstream, child, origin, upstreamOrigin;
let upstreamStatus = 200;
let output = '';

before(async () => {
  upstream = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    requests.push({ method: req.method, url: req.url, key: req.headers['x-api-key'], body: Buffer.concat(chunks).toString() });
    res.writeHead(upstreamStatus, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(upstreamStatus === 200 ? { shortCode: 'test-code', longUrl: 'https://example.com/new' } : { detail: 'Not found' }));
  });
  upstream.listen(0, '127.0.0.1');
  await once(upstream, 'listening');
  upstreamOrigin = `http://127.0.0.1:${upstream.address().port}`;
  const config = join(temporary, 'config.json');
  writeFileSync(config, JSON.stringify({ shlinkBackend: upstreamOrigin, shlinkApiKey: 'test-key', apiUrl: 'https://saved.example' }));
  child = spawn(process.execPath, [fileURLToPath(new URL('../server/server.js', import.meta.url))], {
    env: { ...process.env, PORT: '0', CONFIG_FILE: config, STATIC_DIR: temporary, AUTH_FILE: join(temporary, 'auth.json') },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stderr.on('data', data => { output += data; });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Server startup timeout: ${output}`)), 10000);
    child.stdout.on('data', data => {
      output += data;
      const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (match) { origin = match[0]; clearTimeout(timeout); resolve(); }
    });
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Server exited: ${code}: ${output}`)); });
  });
});

after(async () => {
  if (child && child.exitCode === null) { child.kill(); await once(child, 'exit'); }
  if (upstream) await new Promise(resolve => upstream.close(resolve));
  rmSync(temporary, { recursive: true, force: true });
});

test('configuration is accessible without a token and no OTP file is generated', async () => {
  const response = await fetch(`${origin}/api/config`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.apiUrl, 'https://saved.example');
  assert.equal(existsSync(join(temporary, 'auth.json')), false);
  assert.equal((await fetch(`${origin}/api/auth/login`, { method: 'POST' })).status, 404);
});

test('saved config is used by runtime frontend config and remote requests', async () => {
  const response = await fetch(`${origin}/api/config`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiUrl: 'https://updated.example', shlinkBackend: upstreamOrigin, shlinkApiKey: 'updated-key' })
  });
  assert.equal(response.status, 200);
  const runtime = await fetch(`${origin}/conf/config.js`);
  assert.equal(runtime.headers.get('cache-control'), 'no-store');
  assert.match(await runtime.text(), /https:\/\/updated\.example/);
  const list = await fetch(`${origin}/api/shlink/short-urls?page=2&itemsPerPage=20&searchTerm=hello%20world`);
  assert.equal(list.status, 200);
  const forwarded = requests.at(-1);
  assert.equal(forwarded.key, 'updated-key');
  const url = new URL(forwarded.url, upstreamOrigin);
  assert.equal(url.pathname, '/rest/v3/short-urls');
  assert.equal(url.searchParams.get('page'), '2');
  assert.equal(url.searchParams.get('searchTerm'), 'hello world');
});

test('creation and edits forward JSON, API key and custom domain', async () => {
  const payload = { longUrl: 'https://example.com/new', tags: ['mobile'] };
  const create = await fetch(`${origin}/api/shlink/short-urls`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, customSlug: 'test-code' })
  });
  assert.equal(create.status, 200);
  assert.equal(requests.at(-1).method, 'POST');
  assert.equal(JSON.parse(requests.at(-1).body).customSlug, 'test-code');
  const edit = await fetch(`${origin}/api/shlink/short-urls/test-code?domain=s.example.com`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  assert.equal(edit.status, 200);
  assert.equal(requests.at(-1).method, 'PATCH');
  assert.equal(requests.at(-1).url, '/rest/v3/short-urls/test-code?domain=s.example.com');
  assert.deepEqual(JSON.parse(requests.at(-1).body), payload);
  const remove = await fetch(`${origin}/api/shlink/short-urls/test-code?domain=s.example.com`, {
    method: 'DELETE'
  });
  assert.equal(remove.status, 200);
  assert.equal(requests.at(-1).method, 'DELETE');
  assert.equal(requests.at(-1).url, '/rest/v3/short-urls/test-code?domain=s.example.com');
});

test('upstream errors reach the UI instead of being reported as success', async () => {
  upstreamStatus = 404;
  const response = await fetch(`${origin}/api/shlink/short-urls/missing`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}'
  });
  assert.equal(response.status, 404);
  assert.equal((await response.json()).detail, 'Not found');
  upstreamStatus = 200;
});

test('invalid config is rejected without replacing saved settings', async () => {
  const response = await fetch(`${origin}/api/config`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '[]'
  });
  assert.equal(response.status, 400);
  assert.equal((await (await fetch(`${origin}/api/config`)).json()).data.apiUrl, 'https://updated.example');
});

test('missing remote key fails without forwarding a request', async () => {
  await fetch(`${origin}/api/config`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shlinkBackend: upstreamOrigin, shlinkApiKey: '' })
  });
  const count = requests.length;
  assert.equal((await fetch(`${origin}/api/shlink/short-urls`)).status, 400);
  assert.equal(requests.length, count);
});

test('corrupted local config returns an error without killing the server', async () => {
  writeFileSync(join(temporary, 'config.json'), '{invalid');
  assert.equal((await fetch(`${origin}/api/shlink/short-urls`)).status, 502);
  assert.equal((await fetch(`${origin}/api/health`)).status, 200);
});
