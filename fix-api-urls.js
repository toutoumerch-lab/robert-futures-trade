/**
 * Replaces all hardcoded http://localhost:5001 with import.meta.env.VITE_API_URL
 * so the frontend works in both dev and production.
 */
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'client', 'src');

function walk(dir) {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(walk(full));
    else if (/\.(jsx?|tsx?)$/.test(entry.name)) files.push(full);
  }
  return files;
}

let totalReplaced = 0;

for (const file of walk(SRC_DIR)) {
  let src = fs.readFileSync(file, 'utf8');
  const original = src;

  // 1. Template literals: `http://localhost:5001...`
  //    → `${import.meta.env.VITE_API_URL}...`
  src = src.replace(/`http:\/\/localhost:5001/g, '`${import.meta.env.VITE_API_URL}');

  // 2. Single-quoted strings: 'http://localhost:5001...'
  //    → `${import.meta.env.VITE_API_URL}...`
  src = src.replace(/'http:\/\/localhost:5001([^']*)'/g,
    (_, rest) => '`${import.meta.env.VITE_API_URL}' + rest + '`');

  // 3. Double-quoted strings: "http://localhost:5001..."
  //    → `${import.meta.env.VITE_API_URL}...`
  src = src.replace(/"http:\/\/localhost:5001([^"]*)"/g,
    (_, rest) => '`${import.meta.env.VITE_API_URL}' + rest + '`');

  if (src !== original) {
    fs.writeFileSync(file, src, 'utf8');
    const count = (original.match(/localhost:5001/g) || []).length;
    console.log(`✓ ${path.relative(__dirname, file)} (${count} replaced)`);
    totalReplaced += count;
  }
}

console.log(`\nDone. ${totalReplaced} occurrences replaced across all files.`);
