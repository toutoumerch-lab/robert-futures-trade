const fs = require('fs');

const filePath = 'AdminDashboard.jsx';

// The file has double-encoded UTF-8 emoji.
// Original emoji were correctly encoded as UTF-8 bytes (e.g., F0 9F 8E A8 for 🎨)
// But then each of those bytes was re-encoded as if it were a Latin-1/Unicode code point:
//   F0 -> C3 B0 in UTF-8 (ð)
//   9F -> C2 9F in UTF-8 (control char)
//   8E -> C2 8E in UTF-8 (control char)
//   A8 -> C2 A8 in UTF-8 (¨)
// So each original 4-byte emoji became 8 bytes in the file.
//
// FIX: Read the file as UTF-8 (getting the broken string),
//      then re-encode each character's code point as a raw byte,
//      then interpret those bytes as UTF-8.

const rawBytes = fs.readFileSync(filePath);
const brokenString = rawBytes.toString('utf8');

// Convert back to a Buffer using latin1 encoding
// (latin1 maps each char's code point 0-255 to the byte with that value)
const originalBytes = Buffer.from(brokenString, 'latin1');

// Decode those original bytes as UTF-8 to get the correct string
const fixedString = originalBytes.toString('utf8');

// Verify the fix worked by checking for emoji in the TABS section
const tabsIdx = fixedString.indexOf('const TABS');
if (tabsIdx < 0) {
    process.stdout.write('ERROR: Could not find TABS section!\n');
    process.exit(1);
}

const tabsRegion = fixedString.substring(tabsIdx, tabsIdx + 300);
process.stdout.write('TABS section after fix:\n');

// Write to ASCII-safe output for inspection
let output = '';
for (let i = 0; i < tabsRegion.length; i++) {
    const cp = tabsRegion.codePointAt(i);
    if (cp > 0xFFFF) {
        output += '[U+' + cp.toString(16).toUpperCase() + ']'; // Emoji shown as codepoint
        i++; // Skip surrogate pair
    } else if (cp > 127) {
        output += '[U+' + cp.toString(16).toUpperCase() + ']';
    } else if (cp === 10) {
        output += '\n';
    } else {
        output += tabsRegion[i];
    }
}

fs.writeFileSync('tabs_fixed_check.txt', output, 'ascii');
process.stdout.write('Written to tabs_fixed_check.txt\n');

// If it looks good (emojis are now proper Unicode > 0xFFFF code points), save the file
// For now just save the fixed version
fs.writeFileSync('AdminDashboard_FIXED.jsx', fixedString, 'utf8');
process.stdout.write('Fixed file written to AdminDashboard_FIXED.jsx\n');
process.stdout.write('PLEASE CHECK tabs_fixed_check.txt before replacing original!\n');
