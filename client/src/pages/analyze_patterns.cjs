const fs = require('fs');
const filePath = 'AdminDashboard.jsx';
const rawBytes = fs.readFileSync(filePath);

// Read the full byte sequence at each broken emoji position
// C3 B0 = ð (first byte of all 4-byte emoji when double-encoded)
// We need to capture the full pattern for each occurrence

const brokenPatterns = new Map(); // hex string -> count

let pos = 0;
while (pos < rawBytes.length) {
    if (rawBytes[pos] === 0xC3 && rawBytes[pos+1] === 0xB0 && pos + 2 < rawBytes.length) {
        // Read up to 12 bytes (max double-encoded 4-byte emoji)
        let patternBytes = [0xC3, 0xB0];
        let i = pos + 2;
        // Continue reading "high" byte patterns
        while (i < rawBytes.length && i < pos + 12) {
            const b = rawBytes[i];
            // High bytes in double-encoded sequences: C2xx, C3B0, C5xx, E2xxxx
            if (b >= 0x80) {
                patternBytes.push(b);
                i++;
            } else {
                break;
            }
        }
        const hex = patternBytes.map(b => b.toString(16).padStart(2, '0')).join(' ');
        brokenPatterns.set(hex, (brokenPatterns.get(hex) || 0) + 1);
        pos += 2;
    } else {
        pos++;
    }
}

let output = 'Unique broken patterns:\n';
for (const [hex, count] of brokenPatterns) {
    const bytes = hex.split(' ').map(h => parseInt(h, 16));
    // Try to decode assuming it's Latin chars re-encoded as UTF-8
    // C3B0 = ð (0xF0), C5B8 = Ÿ (0x9F in W1252), etc.
    const decoded = [];
    let j = 0;
    while (j < bytes.length) {
        if (bytes[j] === 0xC3 && j+1 < bytes.length) { decoded.push(0xC0 | (bytes[j] & 0x03) << 6 | (bytes[j+1] & 0x3F)); j += 2; }
        else if (bytes[j] === 0xC5 && j+1 < bytes.length) { decoded.push(0x140 | (bytes[j] & 0x03) << 6 | (bytes[j+1] & 0x3F)); j += 2; }
        else if (bytes[j] === 0xC2 && j+1 < bytes.length) { decoded.push(bytes[j+1]); j += 2; }
        else if (bytes[j] === 0xE2 && j+2 < bytes.length) { decoded.push(0x80 | (bytes[j+1] & 0x0F) << 4 | (bytes[j+2] & 0x3F)); j += 3; }
        else { decoded.push(bytes[j]); j++; }
    }
    const decodedHex = decoded.map(b => b.toString(16).padStart(2, '0')).join(' ');
    output += count + 'x  [' + hex + ']  -> decoded: [' + decodedHex + ']\n';
}

fs.writeFileSync('pattern_analysis.txt', output, 'ascii');
process.stdout.write('Analysis written to pattern_analysis.txt\n');
