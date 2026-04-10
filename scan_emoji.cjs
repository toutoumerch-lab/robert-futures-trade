const fs = require('fs');
const path = require('path');
const ROOT = 'c:/Users/noure/Documents/trades';
const out = [];

function scan(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of entries) {
    if (f.name === 'node_modules' || f.name === '.git') continue;
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { scan(p); }
    else if (/\.(jsx|js)$/.test(f.name) && !f.name.includes('fix_') && !f.name.includes('scan_') && !f.name.includes('encoding') && !f.name.includes('emoji')) {
      const c = fs.readFileSync(p, 'utf8');
      const lines = c.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{23F0}-\u{23FF}\u{2702}-\u{27B0}]+/gu);
        if (m) {
          const rel = path.relative(ROOT, p).replace(/\\/g, '/');
          const trimmed = lines[i].trim().substring(0, 100);
          out.push(rel + ':' + (i + 1) + ' | ' + m.join(' ') + ' | ' + trimmed);
        }
      }
    }
  }
}

scan(path.join(ROOT, 'client/src'));
fs.writeFileSync(path.join(ROOT, 'emoji_scan.txt'), out.join('\n'), 'utf8');
console.log('Found ' + out.length + ' lines with emoji. Written to emoji_scan.txt');
