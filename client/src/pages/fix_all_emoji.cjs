const fs = require('fs');

const filePath = 'AdminDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// We need to find and replace broken emoji sequences in the remaining parts of the file.
// The broken sequences are multiple characters with code points from Latin Extended ranges.
// 
// Strategy: Find all broken emoji sequences by scanning for the pattern of 
// chars with code points around the values that correspond to UTF-8 byte values.
//
// Known remaining broken emojis and what they should be:
// ðŸ"š -> 📚 Books U+1F4DA  
// ðŸ"¸ -> 📸 Camera U+1F4F8
// ðŸŽ¬ -> 🎬 Clapper U+1F3AC
// ðŸ"„ -> 📄 Document U+1F4C4
// 
// We need to find these sequences identifying them by their char code patterns.
// 
// The UTF-8 bytes for each emoji, decoded as Windows-1252/Latin-1, produce these patterns:
// For a 4-byte UTF-8 emoji (F0 XX XX XX):
//   Byte F0 -> char U+00F0 (ð)
//   Bytes that are 80-BF continue bytes -> In Windows-1252 they have special mappings
//   Byte 9F -> U+0178 (Ÿ)
//   Byte 8E -> U+017D (Ž) 
//   Byte 8D -> U+017C (ž) 
//   Byte 8C -> U+0152 (Œ)
//   Byte 8B -> U+2039 (‹) 
//   Byte 9A -> U+0161 (š)
//   Byte A8 -> U+00A8 (¨)
//   Byte A5 -> U+00A5 (¥)
//   Byte A4 -> U+00A4 (¤)
//   Byte AF -> U+00AF (¯)
//   Byte B8 -> U+00B8 (¸)
//   Byte BC -> U+00BC (¼)
//   Byte BB -> U+00BB (»)
//   Byte B1 -> U+00B1 (±)
//   Byte B9 -> U+00B9 (¹)
//   Byte 84 -> U+201E („) double low quote
//   Byte 85 -> U+2026 (…) ellipsis
//   Byte 86 -> U+2020 (†) dagger
//   Byte 89 -> U+2030 (‰) per mille

// The simplest approach: use the known UTF-8 byte sequences for the specific emojis
// and replace them. Since we know the file contains the Mojibake versions,
// we can use regex or direct string comparison.
//
// Let me use a buffer-based approach to find the sequences:
// Read the raw file bytes, find the emoji byte sequences (F0 9F ...) and replace with correct bytes.

const rawBytes = fs.readFileSync(filePath);

// Helper: find and replace byte sequences in Buffer
function replaceBytes(buf, searchBytes, replaceBytes) {
    const results = [];
    let i = 0;
    while (i < buf.length) {
        // Check if searchBytes matches at position i
        let match = true;
        if (i + searchBytes.length > buf.length) match = false;
        if (match) {
            for (let j = 0; j < searchBytes.length; j++) {
                if (buf[i + j] !== searchBytes[j]) {
                    match = false;
                    break;
                }
            }
        }
        if (match) {
            for (const b of replaceBytes) results.push(b);
            i += searchBytes.length;
        } else {
            results.push(buf[i]);
            i++;
        }
    }
    return Buffer.from(results);
}

// The file contains proper UTF-8 emoji bytes (not double-encoded) for most content.
// But the TABS labels and inline emojis ARE double-encoded.
// After the TABS fix, the file now has proper emoji in TABS.
// Let's check for remaining broken sequences by looking for the pattern:
// C3 B0 (ð encoded as UTF-8 two bytes) followed by more high bytes
// This IS the double-encoding pattern.

// UTF-8 sequences for each broken emoji (double-encoded = original UTF-8 bytes, re-encoded as UTF-8)
// For U+00F0 (ð): C3 B0 in UTF-8
// For U+0178 (Ÿ) - this is how 0x9F appears when encoded as UTF-8 in Windows-1252: C5 B8
// But in the case above we saw codes like [178] [17D] etc. in the JavaScript string,
// which means the file is storing the UNICODE code points of those Windows-1252 chars directly.

// Wait - if reading with utf8 gives us code points 0x178, 0x17D, 0xA8,
// then the file ACTUALLY stores the multi-byte UTF-8 representations of those Unicode points.
// U+0178 in UTF-8: C5 B8 (2 bytes)
// U+017D in UTF-8: C5 BD (2 bytes)
// U+00A8 in UTF-8: C2 A8 (2 bytes)
// For one emoji (🎨 = F0 9F 8E A8), the Windows-1252 chars would be:
//   F0 -> ð (U+00F0) -> UTF-8: C3 B0
//   9F -> Ÿ (U+0178) -> UTF-8: C5 B8
//   8E -> Ž (U+017D) -> UTF-8: C5 BD
//   A8 -> ¨ (U+00A8) -> UTF-8: C2 A8
// TOTAL: 8 bytes for one emoji that should be 4 bytes.

// So to fix, we search the raw bytes for these 8-byte patterns and replace with 4-byte emoji:

const emojiMap = [
    // 👥 U+1F465: F0 9F 91 A5 -> Bytes: C3B0 C5B8 C2 91 C2 A5
    // UTF-8 of each W1252 char: F0->C3B0, 9F->C5B8, 91->C291, A5->C2A5
    { search: [0xC3,0xB0,0xC5,0xB8,0xC2,0x91,0xC2,0xA5], replace: [0xF0,0x9F,0x91,0xA5] }, // 👥
    // 📝 U+1F4DD: F0 9F 94 9D -> F0->C3B0, 9F->C5B8, 94->C294, 9D->C29D
    { search: [0xC3,0xB0,0xC5,0xB8,0xC2,0x94,0xC2,0x9D], replace: [0xF0,0x9F,0x94,0x9D] }, // 📝
    // 🎓 U+1F393: F0 9F 8E 93 -> F0->C3B0, 9F->C5B8, 8E->C5BD, 93->C293
    { search: [0xC3,0xB0,0xC5,0xB8,0xC5,0xBD,0xC2,0x93], replace: [0xF0,0x9F,0x8E,0x93] }, // 🎓
    // 💼 U+1F4BC: F0 9F 92 BC -> F0->C3B0, 9F->C5B8, 92->C292, BC->C2BC
    { search: [0xC3,0xB0,0xC5,0xB8,0xC2,0x92,0xC2,0xBC], replace: [0xF0,0x9F,0x92,0xBC] }, // 💼
    // 🎉 U+1F389: F0 9F 8E 89 -> F0->C3B0, 9F->C5B8, 8E->C5BD, 89->E28030? No, 89->E280B0
    // Actually W1252 0x89 = U+2030 (‰), UTF-8: E2 80 B0
    { search: [0xC3,0xB0,0xC5,0xB8,0xC5,0xBD,0xE2,0x80,0xB0], replace: [0xF0,0x9F,0x8E,0x89] }, // 🎉
    // 🎨 U+1F3A8: F0 9F 8E A8 -> F0->C3B0, 9F->C5B8, 8E->C5BD, A8->C2A8
    { search: [0xC3,0xB0,0xC5,0xB8,0xC5,0xBD,0xC2,0xA8], replace: [0xF0,0x9F,0x8E,0xA8] }, // 🎨
    // 📱 U+1F4F1: F0 9F 94 B1 -> F0->C3B0, 9F->C5B8, 94->C294, B1->C2B1
    { search: [0xC3,0xB0,0xC5,0xB8,0xC2,0x94,0xC2,0xB1], replace: [0xF0,0x9F,0x94,0xB1] }, // 📱
    // 💻 U+1F4BB: F0 9F 92 BB -> F0->C3B0, 9F->C5B8, 92->C292, BB->C2BB
    { search: [0xC3,0xB0,0xC5,0xB8,0xC2,0x92,0xC2,0xBB], replace: [0xF0,0x9F,0x92,0xBB] }, // 💻
    // 📸 U+1F4F8: F0 9F 94 B8 -> F0->C3B0, 9F->C5B8, 94->C294, B8->C2B8
    { search: [0xC3,0xB0,0xC5,0xB8,0xC2,0x94,0xC2,0xB8], replace: [0xF0,0x9F,0x94,0xB8] }, // 📸
    // 🎬 U+1F3AC: F0 9F 8E AC -> F0->C3B0, 9F->C5B8, 8E->C5BD, AC->C2AC
    { search: [0xC3,0xB0,0xC5,0xB8,0xC5,0xBD,0xC2,0xAC], replace: [0xF0,0x9F,0x8E,0xAC] }, // 🎬
    // 📄 U+1F4C4: F0 9F 94 84 -> F0->C3B0, 9F->C5B8, 94->C294, 84->E2809E
    { search: [0xC3,0xB0,0xC5,0xB8,0xC2,0x94,0xE2,0x80,0x9E], replace: [0xF0,0x9F,0x94,0x84] }, // 📄
    // 📚 U+1F4DA: F0 9F 94 9A -> F0->C3B0, 9F->C5B8, 94->C294, 9A->C5A1
    { search: [0xC3,0xB0,0xC5,0xB8,0xC2,0x94,0xC5,0xA1], replace: [0xF0,0x9F,0x94,0x9A] }, // 📚
    // 🏦 U+1F3E6: F0 9F 8F A6 -> F0->C3B0, 9F->C5B8, 8F->C5BE? No... Let's skip for now
    // 🎁 U+1F381: F0 9F 8E 81 -> F0->C3B0, 9F->C5B8, 8E->C5BD, 81->? W1252 0x81=undefined->U+0081 -> UTF-8: C281
    { search: [0xC3,0xB0,0xC5,0xB8,0xC5,0xBD,0xC2,0x81], replace: [0xF0,0x9F,0x8E,0x81] }, // 🎁
];

let fixedBytes = rawBytes;
let replacementCount = 0;

for (const entry of emojiMap) {
    const before = fixedBytes.length;
    fixedBytes = replaceBytes(fixedBytes, entry.search, entry.replace);
    const replaced = (before - fixedBytes.length) / (entry.search.length - entry.replace.length);
    if (replaced > 0) {
        replacementCount += replaced;
        process.stdout.write('Fixed ' + replaced + ' instances of emoji U+' + 
            entry.replace.map(b => b.toString(16)).join('') + '\n');
    }
}

if (replacementCount > 0) {
    fs.writeFileSync(filePath, fixedBytes);
    process.stdout.write('SUCCESS: Fixed ' + replacementCount + ' remaining broken emoji instances.\n');
} else {
    process.stdout.write('No remaining broken emoji found (TABS block already fixed).\n');
}
