const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
  try {
    const page = await browser.newPage({ timezoneId: 'Asia/Shanghai', viewport: { width: 1280, height: 900 } });
    await page.clock.install({ time: new Date('2026-09-26T04:00:00Z') });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const config = {
      nodeOptions: [{ text: '订阅源', value: 'https://example.com/sub' }],
      ruleOptions: [{ text: '白名单自动（漏网走代理）', value: 'https://example.com/auto.ini' }, { text: '黑名单手动（漏网走直连）', value: 'https://example.com/manual.ini' }],
      yamlforgeScripts: [{ text: 'MYUSE', value: 'https://example.com/MYUSE.js' }, { text: 'MOBILE.js', value: 'https://example.com/MOBILE.js' }],
      apiUrl: 'https://conv.example.com', yamlforgeBackend: 'https://forge.example.com', yamlforgeApiKey: 'test-key',
      shlinkBackend: 'https://s.example.com', shlinkPublicUrl: 'https://s.example.com', shlinkApiKey: 'test-key'
    };
    let created = null;
    await page.route('**/api/config', route => route.fulfill({ json: { success: true, data: config } }));
    await page.route('**/api/shlink/**', route => {
      assert.equal(route.request().method(), 'POST');
      created = route.request().postDataJSON();
      return route.fulfill({ status: 201, json: { shortCode: 'test', shortUrl: 'https://s.example.com/test' } });
    });
    await page.goto('http://127.0.0.1:25503/');
    await page.locator('#app').getByText('MYUSE', { exact: true }).waitFor();
    const toggle = page.getByRole('switch', { name: 'YamlForge 高级处理/合并', exact: true });
    const toggleControl = page.locator('.el-switch');
    assert.equal(await toggle.getAttribute('aria-checked'), 'true');
    const filename = page.getByRole('textbox', { name: '输出文件名', exact: true });
    assert.equal(await filename.getAttribute('placeholder'), '白名单自动（漏网走代理）_MYUSE_2026-09-26.yaml');
    assert.equal(await filename.inputValue(), '');

    async function convert(expectedFilename) {
      await page.getByRole('button', { name: '转换', exact: true }).click();
      const result = new URL(await page.getByPlaceholder('点击转换生成订阅链接').inputValue());
      assert.equal(result.origin, 'https://forge.example.com');
      assert.equal(result.pathname, '/yamlprocess');
      assert.equal(result.searchParams.get('filename'), expectedFilename);
      return result;
    }
    let result = await convert('白名单自动（漏网走代理）_MYUSE_2026-09-26.yaml');
    assert.equal(result.searchParams.get('merge'), 'https://example.com/MYUSE.js');
    assert.equal(new URL(result.searchParams.get('source')).searchParams.get('config'), 'https://example.com/auto.ini');

    await page.locator('.el-select').nth(1).click();
    await page.getByRole('option', { name: '黑名单手动', exact: true }).click();
    await page.locator('.el-select').nth(3).click();
    await page.getByRole('option', { name: 'MOBILE.js', exact: true }).click();
    assert.equal(await filename.getAttribute('placeholder'), '黑名单手动（漏网走直连）_MOBILE_2026-09-26.yaml');
    result = await convert('黑名单手动（漏网走直连）_MOBILE_2026-09-26.yaml');
    assert.equal(result.searchParams.get('merge'), 'https://example.com/MOBILE.js');

    await filename.fill('自定义名称');
    await convert('自定义名称.yaml');
    await filename.fill('custom.yml');
    await convert('custom.yml');
    await filename.fill('   ');
    await convert('黑名单手动（漏网走直连）_MOBILE_2026-09-26.yaml');
    await page.getByRole('button', { name: '生成短链', exact: true }).click();
    await page.getByPlaceholder('点击生成 Shlink 短链接').waitFor();
    await page.waitForFunction(() => document.querySelector('input[placeholder="点击生成 Shlink 短链接"]').value !== '');
    assert.equal(new URL(created.longUrl).searchParams.get('filename'), '黑名单手动（漏网走直连）_MOBILE_2026-09-26.yaml');
    assert.deepEqual(created.tags, ['订阅源-黑名单手动（漏网走直连）-MOBILE.js']);

    await filename.fill('debug.yml');
    await toggleControl.click();
    assert.equal(await toggle.getAttribute('aria-checked'), 'false');
    assert.equal(await filename.isVisible(), true);
    assert.equal(await filename.getAttribute('placeholder'), '黑名单手动（漏网走直连）_2026-09-26.yaml');
    assert.equal(await filename.inputValue(), 'debug.yml');
    await page.getByRole('button', { name: '转换', exact: true }).click();
    const plain = new URL(await page.getByPlaceholder('点击转换生成订阅链接').inputValue());
    assert.equal(plain.origin, 'https://conv.example.com');
    assert.equal(plain.pathname, '/sub');
    assert.equal(plain.searchParams.has('filename'), false);
    const createdWithoutForge = page.waitForResponse(response => response.url().includes('/api/shlink/short-urls') && response.request().method() === 'POST');
    await page.getByRole('button', { name: '生成短链', exact: true }).click();
    await createdWithoutForge;
    assert.equal(new URL(created.longUrl).origin, 'https://conv.example.com');
    assert.deepEqual(created.tags, ['订阅源-黑名单手动（漏网走直连）']);
    await toggleControl.click();
    assert.equal(await filename.inputValue(), 'debug.yml');
    assert.equal(await filename.getAttribute('placeholder'), '黑名单手动（漏网走直连）_MOBILE_2026-09-26.yaml');
    await convert('debug.yml');

    config.yamlforgeScripts = [];
    await page.reload();
    await page.locator('#app').getByText('白名单自动（漏网走代理）', { exact: true }).waitFor();
    await page.getByRole('button', { name: '转换', exact: true }).click();
    await page.getByText('请选择 JS 脚本', { exact: true }).last().waitFor();
    assert.equal(await page.getByPlaceholder('点击转换生成订阅链接').inputValue(), '');
    await toggleControl.click();
    assert.equal(await filename.getAttribute('placeholder'), '白名单自动（漏网走代理）_2026-09-26.yaml');
    await page.getByRole('button', { name: '转换', exact: true }).click();
    assert.equal(new URL(await page.getByPlaceholder('点击转换生成订阅链接').inputValue()).origin, 'https://conv.example.com');
    assert.deepEqual(errors, []);
    console.log('YamlForge checks passed: default on, debug bypass, retained inputs, dynamic filename, short-link payload and missing-script validation.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
