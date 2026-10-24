const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const config = {
      nodeOptions: [{ text: '订阅源', value: 'https://example.com/sub' }],
      ruleOptions: [{ text: '规则', value: 'https://example.com/rule.ini' }],
      yamlforgeScripts: [{ text: '脚本', value: 'https://example.com/script.js' }],
      apiUrl: 'https://conv.example.com', yamlforgeBackend: 'https://forge.example.com',
      yamlforgeApiKey: 'test-key', shlinkBackend: 'https://s.example.com',
      shlinkApiKey: 'test-key', shlinkPublicUrl: 'https://s.example.com'
    };
    const row = { shortCode: 'theme-test', shortUrl: 'https://s.example.com/theme-test', longUrl: 'https://example.com/sub', tags: ['mobile'], visitsSummary: { total: 12 } };
    await page.route('**/api/config', route => route.fulfill({ json: { success: true, data: config } }));
    await page.route('**/api/shlink/**', route => {
      assert.equal(route.request().method(), 'GET', 'Theme tests must not write Shlink data');
      return route.fulfill({ json: { shortUrls: { data: [row], pagination: { totalItems: 1, currentPage: 1 } } } });
    });
    const screenshots = join(__dirname, '..', 'data', 'ui-check', 'themes');
    mkdirSync(screenshots, { recursive: true });

    async function verifyTheme(theme, surfaces = []) {
      await page.waitForFunction(dark => document.documentElement.classList.contains('dark') === dark, theme === 'dark');
      const styles = await page.evaluate(selectors => {
        return [document.body, ...selectors.map(selector => document.querySelector(selector))].map(element => {
          if (!element) throw new Error('Missing theme test surface');
          const style = getComputedStyle(element);
          return { background: style.backgroundColor, color: style.color };
        });
      }, surfaces);
      for (const style of styles) {
        const rgb = style.background.match(/\d+/g).slice(0, 3).map(Number);
        const brightness = rgb.reduce((sum, value) => sum + value, 0) / 3;
        assert.ok(theme === 'dark' ? brightness < 80 : brightness > 220, `${theme} surface: ${style.background}`);
      }
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), theme);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Page overflows horizontally');
    }

    for (const viewport of [{ name: 'desktop', width: 1280, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      for (const theme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme: theme });
        await page.goto('http://127.0.0.1:25503/');
        await page.locator('#app').getByText('订阅源', { exact: true }).waitFor();
        await verifyTheme(theme, ['.navbar-header', '.sub-card', '.el-input__wrapper']);
        await page.screenshot({ path: join(screenshots, `home-${viewport.name}-${theme}.png`), fullPage: true, animations: 'disabled' });
        await page.locator('.el-switch').click();
        const filename = page.getByRole('textbox', { name: '输出文件名', exact: true });
        assert.equal(await filename.isVisible(), true);
        assert.match(await filename.getAttribute('placeholder'), /^规则_\d{4}-\d{2}-\d{2}\.yaml$/);
        await verifyTheme(theme, ['.sub-card', '.el-input__wrapper']);
        await page.screenshot({ path: join(screenshots, `home-disabled-${viewport.name}-${theme}.png`), fullPage: true, animations: 'disabled' });
        await page.locator('.el-switch').click();

        await page.getByRole('link', { name: '短链接管理', exact: true }).click();
        await page.getByText(row.shortUrl, { exact: true }).waitFor();
        await verifyTheme(theme, ['.el-table']);
        await page.screenshot({ path: join(screenshots, `links-${viewport.name}-${theme}.png`), fullPage: true, animations: 'disabled' });
        await page.getByRole('button', { name: '编辑目标地址' }).click();
        await page.getByRole('dialog').waitFor();
        await verifyTheme(theme, ['.el-dialog', '.el-textarea__inner']);
        await page.screenshot({ path: join(screenshots, `dialog-${viewport.name}-${theme}.png`), fullPage: true, animations: 'disabled' });
        await page.getByRole('button', { name: '取消', exact: true }).click();
        await page.getByRole('dialog').waitFor({ state: 'hidden' });

        await page.getByRole('link', { name: '配置', exact: true }).click();
        await page.getByRole('textbox').first().waitFor();
        await verifyTheme(theme, ['.el-input__wrapper']);
        await page.screenshot({ path: join(screenshots, `config-${viewport.name}-${theme}.png`), fullPage: true, animations: 'disabled' });
        const opposite = theme === 'dark' ? 'light' : 'dark';
        await page.emulateMedia({ colorScheme: opposite });
        await verifyTheme(opposite, ['.el-input__wrapper']);
      }
    }
    assert.deepEqual(errors, []);
    console.log('Theme checks passed: light/dark, desktop/mobile, home/list/config/dialog and live system-theme changes.');
    console.log(`Screenshots: ${screenshots}`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
