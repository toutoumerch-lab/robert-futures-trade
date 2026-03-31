const fs = require('fs');
const filePath = 'AdminDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// The remaining broken emoji are still in the file as double-encoded sequences.
// When read as UTF-8, these sequences appear as strings of characters with high code points.
// We need to use Buffer operations to do a complete fix.

// The most reliable approach: read file as binary, interpret bytes through Windows-1252 mapping,
// then write as UTF-8.

// Windows-1252 to Unicode mapping for the "problematic" bytes (0x80-0x9F range)
const W1252_MAP = {
    0x80: 0x20AC, // €
    0x82: 0x201A, // ‚
    0x83: 0x0192, // ƒ
    0x84: 0x201E, // „
    0x85: 0x2026, // …
    0x86: 0x2020, // †
    0x87: 0x2021, // ‡
    0x88: 0x02C6, // ˆ
    0x89: 0x2030, // ‰
    0x8A: 0x0160, // Š
    0x8B: 0x2039, // ‹
    0x8C: 0x0152, // Œ
    0x8E: 0x017D, // Ž
    0x91: 0x2018, // '
    0x92: 0x2019, // '
    0x93: 0x201C, // "
    0x94: 0x201D, // "
    0x95: 0x2022, // •
    0x96: 0x2013, // –
    0x97: 0x2014, // —
    0x98: 0x02DC, // ˜
    0x99: 0x2122, // ™
    0x9A: 0x0161, // š
    0x9B: 0x203A, // ›
    0x9C: 0x0153, // œ
    0x9E: 0x017E, // ž
    0x9F: 0x0178, // Ÿ
};

// Read raw bytes
const rawBytes = fs.readFileSync(filePath);

// Build a properly decoded string using Windows-1252 byte mapping
let correctedChars = [];
let i = 0;
while (i < rawBytes.length) {
    const b = rawBytes[i];
    
    // Check for 4-byte UTF-8 sequence starting with F0 (emoji range)
    if (b === 0xF0 && i+3 < rawBytes.length) {
        const b2 = rawBytes[i+1], b3 = rawBytes[i+2], b4 = rawBytes[i+3];
        if ((b2 & 0xC0) === 0x80 && (b3 & 0xC0) === 0x80 && (b4 & 0xC0) === 0x80) {
            // Valid 4-byte UTF-8 emoji - decode it
            const cp = ((b & 0x07) << 18) | ((b2 & 0x3F) << 12) | ((b3 & 0x3F) << 6) | (b4 & 0x3F);
            correctedChars.push(String.fromCodePoint(cp));
            i += 4;
            continue;
        }
    }
    
    // Check for 3-byte UTF-8 sequence
    if ((b & 0xE0) === 0xE0 && i+2 < rawBytes.length) {
        const b2 = rawBytes[i+1], b3 = rawBytes[i+2];
        if ((b2 & 0xC0) === 0x80 && (b3 & 0xC0) === 0x80) {
            const cp = ((b & 0x0F) << 12) | ((b2 & 0x3F) << 6) | (b3 & 0x3F);
            correctedChars.push(String.fromCodePoint(cp));
            i += 3;
            continue;
        }
    }
    
    // Check for 2-byte UTF-8 sequence
    if ((b & 0xE0) === 0xC0 && i+1 < rawBytes.length) {
        const b2 = rawBytes[i+1];
        if ((b2 & 0xC0) === 0x80) {
            const cp = ((b & 0x1F) << 6) | (b2 & 0x3F);
            correctedChars.push(String.fromCodePoint(cp));
            i += 2;
            continue;
        }
    }
    
    // ASCII byte
    correctedChars.push(String.fromCharCode(b));
    i++;
}

const correctedContent = correctedChars.join('');

// Verify: find TABS and check
const tabsIdx = correctedContent.indexOf('const TABS');
if (tabsIdx >= 0) {
    const tabsSection = correctedContent.substring(tabsIdx, tabsIdx + 300);
    process.stdout.write('TABS section (first 150 chars):\n');
    for (let j = 0; j < Math.min(150, tabsSection.length); j++) {
        const cp2 = tabsSection.codePointAt(j);
        if (cp2 > 0xFFFF) {
            process.stdout.write('[U+' + cp2.toString(16) + ']');
            j++;
        } else if (cp2 > 127) {
            process.stdout.write('[' + cp2.toString(16) + ']');
        } else if (cp2 === 10) {
            process.stdout.write('\\n\n');
        } else {
            process.stdout.write(tabsSection[j]);
        }
    }
    process.stdout.write('\n');
} else {
    process.stdout.write('ERROR: TABS not found in corrected content!\n');
}

// This approach just re-parses valid UTF-8 sequences, so it shouldn't change already-
// correct emoji. If the broken "double-encoded" sequences are stored as INVALID UTF-8,
// they will be passed through as individual bytes.

// Instead, let's just write the already-correct content back (should be same),
// NOT save yet - just diagnostic
process.stdout.write('\nNote: This script is diagnostic only. Content length: ' + correctedContent.length + '\n');
process.stdout.write('Original content length: ' + content.length + '\n');
