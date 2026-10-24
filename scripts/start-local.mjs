import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
if (!existsSync(vite) || !existsSync(join(root, 'server', 'node_modules', 'express'))) {
  console.error('Dependencies missing. Run npm install in subweb and subweb/server first.');
  process.exit(1);
}

const build = spawnSync(process.execPath, [vite, 'build'], { cwd: root, stdio: 'inherit' });
if (build.error || build.status !== 0) {
  console.error('Frontend build failed. The local server was not started.');
  process.exit(1);
}
await import('../server/server.js');
