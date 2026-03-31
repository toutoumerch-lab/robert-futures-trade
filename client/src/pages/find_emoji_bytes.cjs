const fs = require('fs');
const filePath = 'AdminDashboard.jsx';
const rawBytes = fs.readFileSync(filePath);

// Find ALL C3 B0 patterns and print surrounding bytes
let pos = 0;
let count = 0;
const results = [];
while (pos < rawBytes.length) {
    if (rawBytes[pos] === 0xC3 && rawBytes[pos+1] === 0xB0) {
        const start = Math.max(0, pos - 5);
        const end = Math.min(rawBytes.length, pos + 20);
        let hex = 'pos=' + pos + ': ';
        let ascii = '';
        for (let i = start; i < end; i++) {
            hex += rawBytes[i].toString(16).padStart(2, '0') + ' ';
        }
        results.push(hex);
        count++;
        pos += 2;
    } else {
        pos++;
    }
}

fs.writeFileSync('emoji_positions.txt', results.join('\n'), 'ascii');
process.stdout.write('Found ' + count + ' broken emoji sequences. See emoji_positions.txt\n');
