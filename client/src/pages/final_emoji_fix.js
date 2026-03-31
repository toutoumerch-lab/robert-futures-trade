import fs from 'fs';

let content = fs.readFileSync('AdminDashboard.jsx', 'utf8');

const replacements = [
  { regex: /â­ ï¸ /g, replacement: '⭐' },
  { regex: /ðŸ ¢ Basic Information/g, replacement: '🏢 Basic Information' },
  { regex: /â­ /g, replacement: '⭐' },
  { regex: /âš™ï¸  Trading Rules & Metrics/g, replacement: '⚙️ Trading Rules & Metrics' },
  { regex: /âœ“/g, replacement: '✔️' },
  { regex: /âœ—/g, replacement: '❌' },
  { regex: /Loading promotionsâ€¦/g, replacement: 'Loading promotions...' },
  { regex: /âš¡/g, replacement: '⚡' },
  { regex: /ðŸ ¢ Slow/g, replacement: '🐢 Slow' },
  { regex: /ðŸ ¢/g, replacement: '🐢' } // Catch-all for any other slow indicators
];

let modified = false;
let result = content;

for (const r of replacements) {
  if (r.regex.test(result)) {
    result = result.replace(r.regex, r.replacement);
    modified = true;
  }
}

if (modified) {
  fs.writeFileSync('AdminDashboard.jsx', result, 'utf8');
  console.log('Successfully fixed remaining corrupted emojis.');
} else {
  console.log('No corrupted emojis found to fix.');
}
