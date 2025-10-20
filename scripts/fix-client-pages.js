/* eslint-disable @typescript-eslint/no-require-imports */
// scripts/fix-client-pages.js
// 実行: node scripts/fix-client-pages.js
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const PAGES_DIRS = ['pages', 'src/pages']; // どちらか存在する方を対象
const IGNORES = ['node_modules', '.next', 'public', 'scripts', 'out', '.git'];

// 判定パターン: これらを含むファイルは "client-only" にする
const CLIENT_PATTERNS = [
  /from\s+['"]firebase\/auth['"]/,
  /from\s+['"]firebase\/firestore['"]/,
  /from\s+['"]@?firebase\//,
  /loadStripe\(|from\s+['"]@stripe\/stripe-js['"]/,
  /onAuthStateChanged\(/,
  /\bwindow\b/,
  /\bdocument\b/,
  /localStorage\b/,
  /sessionStorage\b/,
];

function walk(dir, cb) {
  const names = fs.readdirSync(dir);
  for (const name of names) {
    if (IGNORES.includes(name)) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

function processFile(file) {
  if (!/\.(tsx|ts|jsx|js)$/.test(file)) return;
  if (/\/api\//.test(file)) return; // API ルートは無視
  let src = fs.readFileSync(file, 'utf8');
  // 既に'use client' があるか、App Routerの"export default function Page"でappDir想定のファイルは除外
  if (/^\s*['"]use client['"]/.test(src)) return;

  const matched = CLIENT_PATTERNS.some((re) => re.test(src));
  if (!matched) return;

  // insert at very top, but keep shebang if any
  if (src.startsWith('#!')) {
    const idx = src.indexOf('\n');
    src = src.slice(0, idx + 1) + `'use client';\n` + src.slice(idx + 1);
  } else {
    src = `'use client';\n` + src;
  }

  fs.writeFileSync(file, src, 'utf8');
  console.log('[CLIENTIZED]', file);
}

function main() {
  let used = false;
  for (const d of PAGES_DIRS) {
    const dir = path.join(ROOT, d);
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      walk(dir, processFile);
      used = true;
    }
  }
  if (!used) {
    console.error('No pages directory found in', PAGES_DIRS);
    process.exit(1);
  } else {
    console.log('Done. Review changed files with git diff and run build.');
  }
}

main();
