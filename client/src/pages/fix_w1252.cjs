const fs = require('fs');
const filePath = 'AdminDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Windows-1252 byte to Unicode code point mapping for 0x80-0x9F range
const W1252 = {
    0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E, 0x85: 0x2026,
    0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160,
    0x8B: 0x2039, 0x8C: 0x0152, 0x8E: 0x017D, 0x91: 0x2018, 0x92: 0x2019,
    0x93: 0x201C, 0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
    0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A, 0x9C: 0x0153,
    0x9E: 0x017E, 0x9F: 0x0178
};

// Reverse map: Unicode code point -> W1252 byte value (for 0x80-0x9F range)
const W1252_REVERSE = {};
for (const [byte, cp] of Object.entries(W1252)) {
    W1252_REVERSE[cp] = parseInt(byte);
}

// For U+0080 to U+00FF, the W1252 byte value equals the code point
// (with exceptions above). For 0xA0-0xFF: cp maps directly to byte value.

// Given a string that was decoded from W1252 bytes as Unicode chars,
// convert back to the original bytestream, then re-interpret as UTF-8.
// This reverses the double-encoding.

// Step 1: Convert the "broken" string back to original bytes
function stringToW1252Bytes(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
        const cp = str.codePointAt(i);
        if (cp > 0xFFFF) { i++; } // skip, shouldn't happen for broken sequences
        
        if (cp < 0x80) {
            bytes.push(cp); // ASCII
        } else if (cp >= 0xA0 && cp <= 0xFF) {
            bytes.push(cp); // Latin-1 supplement (same byte value)
        } else if (W1252_REVERSE[cp] !== undefined) {
            bytes.push(W1252_REVERSE[cp]); // W1252 special chars
        } else if (cp >= 0x100 && cp <= 0x17F) {
            // Latin Extended A/B range - these shouldn't appear but handle anyway
            // For the cases we see (0x178, 0x17D, 0x161, etc.), they're W1252 chars
            bytes.push(W1252_REVERSE[cp] || 0x3F); // 0x3F = '?' as fallback
        } else {
            bytes.push(0x3F); // fallback
        }
    }
    return bytes;
}

// Find all runs of "broken" characters (code points in W1252 special ranges)
// and convert them to proper emoji.
// A broken run starts with U+00F0 (ð = W1252 0xF0) and consists of chars that
// would be valid W1252 bytes if you reverse-map them.

// The U+00F0 char maps back to byte 0xF0 which starts a 4-byte UTF-8 sequence.
// We look for U+00F0 followed by chars that would decode to U+009F (Ÿ = byte 0x9F),
// then two more chars that decode to valid UTF-8 continuation bytes.

// Strategy: scan the string for U+00F0 (ð) and try to decode the next 3 chars as emoji bytes
let count = 0;
let result = '';
let i = 0;
while (i < content.length) {
    const cp = content.codePointAt(i);
    
    // Potential start of broken emoji: ð = 0x00F0
    if (cp === 0x00F0) {
        // Try to get 3 more chars that map to continuation bytes (0x80-0xBF)
        const chars = [content[i]];
        let j = i + 1;
        while (j < content.length && chars.length < 4) {
            const nextCp = content.codePointAt(j);
            // Continuation byte if original byte would be 0x80-0xBF
            // Check if this char's W1252 reverse map gives 0x80-0xBF
            let byte;
            if (nextCp >= 0xA0 && nextCp <= 0xBF) byte = nextCp; // direct
            else if (W1252_REVERSE[nextCp] !== undefined) byte = W1252_REVERSE[nextCp];
            else byte = nextCp < 0x100 ? nextCp : null;
            
            if (byte !== null && byte >= 0x80 && byte <= 0xBF) {
                chars.push(content[j]);
                j++;
            } else break;
        }
        
        if (chars.length === 4) {
            // Got 4 chars. Convert back to bytes.
            const bytes = stringToW1252Bytes(chars.join(''));
            if (bytes[0] === 0xF0 && (bytes[1] & 0xC0) === 0x80 && 
                (bytes[2] & 0xC0) === 0x80 && (bytes[3] & 0xC0) === 0x80) {
                // Valid 4-byte UTF-8 sequence!
                const emojiCp = ((bytes[0] & 0x07) << 18) | ((bytes[1] & 0x3F) << 12) | 
                                 ((bytes[2] & 0x3F) << 6) | (bytes[3] & 0x3F);
                result += String.fromCodePoint(emojiCp);
                i = j;
                count++;
                continue;
            }
        }
        
        // Couldn't decode as emoji - check if it's a valid 3-char sequence for W1252 0x9F 0x9A etc
        if (chars.length >= 3) {
            const bytes3 = stringToW1252Bytes(chars.slice(0, 3).join(''));
        }
    }
    
    // Also handle the case where the first char is something other than ð but still part
    // of a broken sequence. But for now, just pass through.
    if (cp > 0xFFFF) {
        result += String.fromCodePoint(cp);
        i += 2; // surrogate pair
    } else {
        result += content[i];
        i++;
    }
}

process.stdout.write('Fixed ' + count + ' emoji sequences.\n');
process.stdout.write('Result length: ' + result.length + ' (original: ' + content.length + ')\n');

if (count > 0) {
    fs.writeFileSync(filePath, result, 'utf8');
    process.stdout.write('File saved.\n');
} else {
    process.stdout.write('No changes made.\n');
}
