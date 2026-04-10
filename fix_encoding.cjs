/**
 * Fix ALL remaining broken UTF-8 in JSX files.
 * This covers the alternate Win-1252 mapping where byte 0x94 = U+201D (not U+201C).
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname);

// Additional broken patterns (alternate W1252 encodings)
const SUBS = [
  // ─ = E2 94 80: byte 94 = U+201D in W1252 (alternate), byte 80 = U+20AC
  ['\u00E2\u201D\u20AC', '\u2500'],
  // ─ = E2 94 80: byte 94 = U+201C (original map)  
  ['\u00E2\u201C\u20AC', '\u2500'],
  // ═ repeated pattern (from CSS fix)
  ['\u2022\u0090\u00E2', '\u2550'],
  // Another ═ variant
  ['\u00E2\u2022\u0090', '\u2550'],
  // Arrow → = E2 86 92: byte 86 = U+2020, byte 92 = U+2019
  ['\u00E2\u2020\u2019', '\u2192'],
  // Arrow ← = E2 86 90
  ['\u00E2\u2020\u0090', '\u2190'],
  // ✨ = E2 9C A8: byte 9C = U+0153, byte A8 = U+00A8
  ['\u00E2\u0153\u00A8', '\u2728'],
  // ✕ = E2 9C 95: byte 95 = U+2022
  ['\u00E2\u0153\u2022', '\u2715'],
  // ✗ = E2 9C 97: byte 97 = U+2014
  ['\u00E2\u0153\u2014', '\u2717'],
  // ✓ = E2 9C 93: byte 93 = U+201C
  ['\u00E2\u0153\u201C', '\u2713'],
  // ✔ = E2 9C 94: byte 94 = U+201D
  ['\u00E2\u0153\u201D', '\u2714'],
  // ⏱ = E2 8F B1: byte 8F = control (U+008F), byte B1 = U+00B1
  ['\u00E2\u008F\u00B1', '\u23F1'],
  // ▲ = E2 96 B2: byte 96 = U+2013, byte B2 = U+00B2
  ['\u00E2\u2013\u00B2', '\u25B2'],
  // ▼ = E2 96 BC: byte 96 = U+2013, byte BC = U+00BC
  ['\u00E2\u2013\u00BC', '\u25BC'],
  // ▶ = E2 96 B6: byte B6 = U+00B6
  ['\u00E2\u2013\u00B6', '\u25B6'],
  // — = E2 80 94: byte 80 = U+20AC, byte 94 = U+201D
  ['\u00E2\u20AC\u201D', '\u2014'],
  // – = E2 80 93: byte 93 = U+201C
  ['\u00E2\u20AC\u201C', '\u2013'],
  // … = E2 80 A6: byte A6 = U+00A6
  ['\u00E2\u20AC\u00A6', '\u2026'],
  // ' = E2 80 99: byte 99 = U+2122
  ['\u00E2\u20AC\u2122', '\u2019'],
  // • = E2 80 A2: byte A2 = U+00A2
  ['\u00E2\u20AC\u00A2', '\u2022'],
  // ⚖️ = E2 9A 96 EF B8 8F
  ['\u00E2\u0161\u2013\u00EF\u00B8\u008F', '\u2696\uFE0F'],
  ['\u00E2\u0161\u2013', '\u2696'],
  // ⚙️ = E2 9A 99 EF B8 8F
  ['\u00E2\u0161\u2122\u00EF\u00B8\u008F', '\u2699\uFE0F'],
  ['\u00E2\u0161\u2122', '\u2699'],
  // ⚡ = E2 9A A1
  ['\u00E2\u0161\u00A1', '\u26A1'],
  // ⭐ = E2 AD 90
  ['\u00E2\u00AD\u0090', '\u2B50'],
  // ★ = E2 98 85: byte 98 = U+02DC, byte 85 = U+2026
  ['\u00E2\u02DC\u2026', '\u2605'],
  
  // Triple-encoded patterns from AdminDashboard
  ['\u00C3\u00A2\u0160\u201C\u00E2\u20AC\u201D', '\u2717'],  // ✗
  ['\u00C3\u00A2\u0160\u201C\u00E2\u20AC\u2026', '\u2713'],  // ✓
  ['\u00C3\u00A2\u0160\u201C\u00E2\u20AC\u00A2', '\u2715'],  // ✕
  ['\u00C3\u00A2\u00E2\u20AC\u00A0\u00E2\u20AC\u2122', '\u2197'], // ↗
  ['\u00C3\u00A2\u0082\u0082\u00B1', '\u23F1'],               // ⏱
  ['\u00C3\u00A2\u00E2\u20AC\u0161\u00E2\u20AC\u00AC', '\u2500'], // ─ triple
  
  // AdminDashboard additional patterns (the â prefix variants)
  ['\u00C3\u00A2\u0160\u201C\u00E2\u20AC\u201C', '\u2713'],  // ✓ (alternate)
];

function scanAndFix(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { scanAndFix(full); continue; }
    if (!/\.(jsx|js|css)$/.test(e.name)) continue;
    if (/fix_|scan_|encoding|emoji|replace_/.test(e.name)) continue;
    
    let content = fs.readFileSync(full, 'utf8');
    const original = content;
    
    // Apply longest patterns first
    const sorted = [...SUBS].sort((a, b) => b[0].length - a[0].length);
    for (const [broken, fixed] of sorted) {
      while (content.includes(broken)) {
        content = content.split(broken).join(fixed);
      }
    }
    
    if (content !== original) {
      fs.writeFileSync(full, content, 'utf8');
      const rel = path.relative(ROOT, full);
      console.log('FIXED: ' + rel);
    }
  }
}

scanAndFix(path.join(ROOT, 'client/src'));
console.log('Done!');
