// Copies ONLY the public website into dist/ for Cloudflare Pages.
// Anything not listed here (API code, config, node_modules, .dev.vars, screenshots) is never published.
import { rmSync, mkdirSync, cpSync } from 'node:fs';

const PUBLIC = ['index.html', 'robots.txt', 'assets'];
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
for (const p of PUBLIC) cpSync(p, `dist/${p}`, { recursive: true });
console.log('Built dist/ with:', PUBLIC.join(', '));
