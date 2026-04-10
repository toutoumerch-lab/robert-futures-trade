/**
 * Fix CSS comment box-drawing mojibake.
 * The ═ (U+2550, UTF-8: E2 95 90) was corrupted to: U+2022(•) U+0090 U+00E2(â)
 * Also fix ─ (U+2500) and other box-drawing comment chars.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname);

function fixCSSComments(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // The repeated pattern for ═ is: \u2022\u0090\u00E2 (bullet, control, â)
  // But the last â might be the start of the next ═ sequence
  // So the effective repeat unit is: \u2022\u0090 followed by the â of the next one
  // Full: •<0x90>â•<0x90>â•<0x90>â...
  // Pattern: (\u00E2?\u2022\u0090)+ (with possible leading/trailing â)
  
  // Replace blocks of this pattern with clean ═ chars
  const brokenEquals = /(?:\u00e2?\u2022\u0090)+\u00e2?/g;
  content = content.replace(brokenEquals, (match) => {
    // Count how many ═ chars: each one is 3 codepoints (•<90>â), 
    // but they share the â between adjacent ones
    // Count occurrences of U+2022 in the match
    let count = 0;
    for (let i = 0; i < match.length; i++) {
      if (match.charCodeAt(i) === 0x2022) count++;
    }
    return '\u2550'.repeat(count); // ═
  });
  
  // Fix ─ (U+2500, UTF-8: E2 94 80) if corrupted
  // E2 -> â, 94 -> " (U+201C in W1252), 80 -> € (U+20AC)
  const brokenDash = /(?:\u00e2?\u201c\u20ac)+\u00e2?/g;
  content = content.replace(brokenDash, (match) => {
    let count = 0;
    for (let i = 0; i < match.length; i++) {
      if (match.charCodeAt(i) === 0x201C) count++;
    }
    return '\u2500'.repeat(count); // ─
  });
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('FIXED: ' + path.relative(ROOT, filePath));
    return true;
  }
  console.log('OK: ' + path.relative(ROOT, filePath));
  return false;
}

// Process files
['client/src/index.css', 'client/src/branding-theme.css'].forEach(f => {
  const fullPath = path.join(ROOT, f);
  if (fs.existsSync(fullPath)) fixCSSComments(fullPath);
});
