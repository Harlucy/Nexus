const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const screenshots = join(__dirname, '..', 'data', 'ui-check');
    mkdirSync(screenshots, { recursive: true });

    await page.goto('http://127.0.0.1:25503');
    await page.getByRole('heading', { name: 'Subconverter 订阅转换' }).waitFor();
    await page.locator('#app').getByText('订阅源', { exact: true }).waitFor();
    assert.equal(page.url(), 'http://127.0.0.1:25503/');
    await page.screenshot({ path: join(screenshots, 'home-desktop.png'), fullPage: true });
    await page.getByRole('link', { name: '短链接管理' }).click();
    await page.getByText('暂无短链接', { exact: true }).waitFor();
    assert.equal(await page.locator('.el-alert--error').count(), 0);

    let row = { shortCode: 'ui-test', shortUrl: 'https://s.example.com/ui-test', domain: 's.example.com', longUrl: 'https://example.com/original', tags: ['mobile'], visitsSummary: { total: 12 } };
    let patch = null;
    let create = null;
    let failSave = false;
    let deleted = false;
    // Intercept every Shlink write; no test links are created on the real server.
    await page.route('**/api/shlink/**', async route => {
      const req = route.request();
      let body = { shortUrls: { data: deleted ? [] : [row], pagination: { totalItems: deleted ? 0 : 1, currentPage: 1 } } };
      let status = 200;
      if (req.method() === 'PATCH') {
        patch = { url: req.url(), ...req.postDataJSON() };
        if (failSave) { status = 404; body = { detail: '测试：短链接不存在' }; }
        else { row = { ...row, ...req.postDataJSON() }; body = row; }
      }
      if (req.method() === 'DELETE') {
        assert.equal(req.postData(), null, 'DELETE must not send a JSON null body');
        deleted = true;
        status = 204;
        body = '';
      }
      if (req.method() === 'POST') { create = req.postDataJSON(); status = 201; body = { shortCode: 'created', shortUrl: 'https://s.example.com/created' }; }
      await route.fulfill({ status, contentType: 'application/json', body: status === 204 ? '' : JSON.stringify(body) });
    });
    await page.getByRole('button', { name: '刷新列表' }).click();
    await page.getByText(row.shortUrl, { exact: true }).waitFor();
    await page.screenshot({ path: join(screenshots, 'links-desktop.png'), fullPage: true });
    await page.getByRole('button', { name: '编辑目标地址' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: '目标地址', exact: true }).fill('https://example.com/updated');
    await dialog.getByRole('textbox', { name: '标签', exact: true }).fill('mobile, test, mobile');
    await dialog.getByRole('button', { name: '保存到服务器' }).click();
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(patch.longUrl, 'https://example.com/updated');
    assert.deepEqual(patch.tags, ['mobile', 'test']);
    assert.equal(new URL(patch.url).searchParams.get('domain'), 's.example.com');

    await page.getByRole('button', { name: '编辑目标地址' }).click();
    await dialog.getByRole('textbox', { name: '目标地址', exact: true }).fill('not a url');
    await dialog.getByRole('button', { name: '保存到服务器' }).click();
    await dialog.getByText('请输入完整的 http 或 https 目标地址').waitFor();
    await dialog.getByRole('textbox', { name: '目标地址', exact: true }).fill('https://example.com/next');
    failSave = true;
    await dialog.getByRole('button', { name: '保存到服务器' }).click();
    await dialog.getByText('测试：短链接不存在').waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: join(screenshots, 'edit-mobile.png'), fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile dialog overflows');
    await dialog.getByRole('button', { name: '取消' }).click();
    await dialog.waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: '删除短链接' }).click();
    await page.getByRole('button', { name: '删除', exact: true }).click();
    await page.getByText('暂无短链接', { exact: true }).waitFor();
    await page.screenshot({ path: join(screenshots, 'links-mobile.png'), fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile list overflows');

    await page.getByRole('link', { name: '订阅转换' }).click();
    await page.locator('#app').getByText('订阅源', { exact: true }).waitFor();
    await page.screenshot({ path: join(screenshots, 'home-mobile.png'), fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile home overflows');
    await page.getByRole('button', { name: '生成短链' }).click();
    await page.getByText('Shlink 短链接 复制成功', { exact: true }).waitFor();
    const generated = new URL(create.longUrl);
    assert.equal(generated.origin, 'https://forge.lululucy.top');
    assert.equal(generated.pathname, '/yamlprocess');
    assert.match(generated.searchParams.get('source'), /^https:\/\/conv\.lululucy\.top\/sub\?/);
    assert.match(generated.searchParams.get('filename'), /_\d{4}-\d{2}-\d{2}\.yaml$/);

    await page.getByRole('link', { name: '配置', exact: true }).click();
    await page.getByRole('heading', { name: '后台管理' }).waitFor();
    assert.equal(await page.getByRole('button', { name: '退出', exact: true }).count(), 0);
    assert.deepEqual(errors, []);
    console.log('UI checks passed: desktop/mobile, no login, remote list, mocked create/edit, validation and error states.');
    console.log(`Screenshots: ${screenshots}`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
